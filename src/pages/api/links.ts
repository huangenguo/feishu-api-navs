import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { Link } from '@/types'

// 飞书API配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const APP_TOKEN = process.env.FEISHU_APP_TOKEN // bitable文档的唯一标识
const TABLE_ID = process.env.FEISHU_TABLE_ID   // 数据表的唯一标识id
// const VIEW_ID = process.env.FEISHU_VIEW_ID     // 视图的唯一标识id

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
// const getViews = async (token: string, appId: string, tableId: string) => {
//   const response = await axios.get(
//     `https://open.feishu.cn/open-apis/bitable/v1/apps/${appId}/tables/${tableId}/views`,
//     {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   )
//   console.log('Views response:', JSON.stringify(response.data, null, 2))
//   return response.data.data.items[0].view_id
// }

interface TableRecord {
  id: string;
  fields: {
    Category?: string | string[];
    [key: string]: any;
  };
}

// API路由处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAccessToken()
    
    // 1. 获取表格列表
    // const tablesResponse = await axios.get(
    //   `https://open.feishu.cn/open-apis/bitable/v1/apps/${TABLE_ID}/tables`,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // )
    
    // const firstTableId = tablesResponse.data.data.items[0].table_id
    
    // 2. 列出记录：获取所有记录 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list
    // const recordsResponse = await axios.get(
    //   `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // )
    // 查询记录：条件搜索（需POST）https://open.feishu.cn/document/docs/bitable-v1/app-table-record/search
    const recordsResponse = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/search?page_size=500`,
      { filter: {} },
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    // 3. 列出视图:获取多维表格数据表中的所有视图
    const viewsResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/views/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (viewsResponse.data.code !== 0) {throw new Error(`获取视图失败: ${viewsResponse.data.msg}`)}
    // https://open.feishu.cn/open-apis/bitable/v1/apps/:app_token/tables/:table_id/views/:view_id
    const views = viewsResponse.data.data.items
    const categoryOrder = views.map((view: { view_name: string }) => view.view_name)
    
    // 4. 处理记录数据
    if (recordsResponse.data.code !== 0) {throw new Error(`获取记录失败: ${recordsResponse.data.msg}`)}
    const records = recordsResponse.data.data.items || []
    
    // 修改处理 Category 的逻辑
    const processedRecords = records.map((record: TableRecord) => ({
      ...record,
      fields: {
        ...record.fields,
        Category: Array.isArray(record.fields.Category) 
          ? record.fields.Category.filter(Boolean) // 过滤空字符串、null、undefined
          : record.fields.Category ? [record.fields.Category].filter(Boolean) : []
      }
    }));
    
    // 打印原始记录示例
    console.log('Sample raw record:', JSON.stringify(processedRecords[0], null, 2))
    
    const links = processedRecords
      .filter((record: any) => 
        typeof record.fields.Title === 'string' && record.fields.Title.trim() !== '' &&
        record.fields.URL && (record.fields.URL.link || record.fields.URL.text) &&
        typeof record.fields.Description === 'string' && record.fields.Description.trim() !== ''
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
        sampleRawRecord: processedRecords[0],
        sampleProcessedLink: links[0],
        recordsCount: processedRecords.length,
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