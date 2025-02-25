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
    
    // 先获取表格列表
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
    
    // 获取视图列表
    const viewsResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${TABLE_ID}/tables/${firstTableId}/views`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    // 获取视图名称作为分类顺序
    const categoryOrder = viewsResponse.data.data.items.map(
      (view: { view_name: string }) => view.view_name
    )
    
    // 获取表格数据
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${TABLE_ID}/tables/${firstTableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.data || !response.data.data) {
      throw new Error('Invalid API response structure')
    }

    const items = response.data.data.items || []
    const links = items
      .filter((item: any) => 
        item.fields.Title && 
        item.fields.URL && 
        item.fields.Description
      )
      .map((item: any) => ({
        title: item.fields.Title || '',
        url: item.fields.URL?.link || item.fields.URL?.text || '',
        description: item.fields.Description || '',
        category: item.fields.Category?.[0] || '',
        icon: item.fields.Icon || '',
        recommend: item.fields.Recommend || '',
        order: parseInt(item.fields.Order || '0', 10),
        tags: item.fields.Tags || []
      }))
      .sort((a: Link, b: Link) => a.order - b.order)

    // 返回带有分类排序的数据
    res.status(200).json({
      links,
      categoryOrder
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