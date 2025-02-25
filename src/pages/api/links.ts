import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { Link } from '@/types'

// 飞书API配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const TABLE_ID = process.env.FEISHU_TABLE_ID

// 获取访问令牌
async function getAccessToken() {
  try {
    const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    })
    return res.data.tenant_access_token
  } catch (error) {
    console.error('Failed to get token:', error)
    throw error
  }
}

// 获取视图列表
const getViews = async (token: string, appId: string, tableId: string) => {
  const response = await axios.get(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appId}/tables/${tableId}/views`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )
  console.log('Views response:', JSON.stringify(response.data, null, 2))
  return response.data.data.items[0].view_id
}

// API路由处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAccessToken()
    
    // 1. 获取表格列表
    const tablesResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${TABLE_ID}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const firstTableId = tablesResponse.data.data.items[0].table_id
    
    // 2. 获取所有记录
    const recordsResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${TABLE_ID}/tables/${firstTableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // 3. 获取所有视图
    const viewsResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${TABLE_ID}/tables/${firstTableId}/views`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const views = viewsResponse.data.data.items
    const categoryOrder = views.map((view: { view_name: string }) => view.view_name)
    
    // 4. 处理记录数据
    const records = recordsResponse.data.data.items || []
    
    // 打印原始记录示例
    console.log('Sample raw record:', JSON.stringify(records[0], null, 2))
    
    const links = records
      .filter((record: any) => 
        record.fields.Title && 
        record.fields.URL && 
        record.fields.Description
      )
      .map((record: any) => ({
        title: record.fields.Title || '',
        url: record.fields.URL?.link || record.fields.URL?.text || '',
        description: record.fields.Description || '',
        category: record.fields.Category || [],
        icon: record.fields.Icon || '',
        recommend: record.fields.Recommend || '',
        order: record.fields.Order ? parseInt(record.fields.Order, 10) : Number.MAX_SAFE_INTEGER,
        tags: record.fields.Tags || [],
        viewOrders: record.fields.Category?.reduce((acc: Record<string, number>, cat: string) => {
          acc[cat] = record.fields.Order ? parseInt(record.fields.Order, 10) : Number.MAX_SAFE_INTEGER
          return acc
        }, {}) || {}
      }))
      .sort((a: Link, b: Link) => a.order - b.order)

    // 打印处理后的示例数据
    console.log('Sample processed link:', JSON.stringify(links[0], null, 2))
    console.log('Sample viewOrders:', JSON.stringify(links[0]?.viewOrders, null, 2))

    // 返回处理后的数据
    res.status(200).json({
      links,
      categoryOrder,
      // 添加调试信息
      debug: {
        sampleRawRecord: records[0],
        sampleProcessedLink: links[0],
        recordsCount: records.length,
        linksCount: links.length
      }
    })
    
  } catch (error: any) {
    console.error('API Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message,
      details: error.response?.data
    })
  }
}