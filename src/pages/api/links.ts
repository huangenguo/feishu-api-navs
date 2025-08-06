import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { Link } from '@/types'

// 飞书API配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const APP_TOKEN = process.env.FEISHU_APP_TOKEN // bitable文档的唯一标识
const TABLE_ID = process.env.FEISHU_TABLE_ID   // 数据表的唯一标识id

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
// 列出记录：获取所有记录 旧API  https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list
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
// 分页获取所有记录的函数
async function getAllRecords(token: string, appToken: string, tableId: string) {
  const allRecords: any[] = []
  let pageToken = '' // 分页标记，初始为空表示第一页
  const pageSize = 100 // 每页最大条数（飞书API支持1-500）

  try {
    // 循环获取所有分页数据
    do {
      const response = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
        { 
          page_size: pageSize,
          page_token: pageToken // 传递上一页的分页标记
        },
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.code !== 0) {
        throw new Error(`分页获取失败: ${response.data.msg} (code: ${response.data.code})`)
      }

      // 累加当前页数据
      allRecords.push(...response.data.data.items)
      
      // 更新分页标记，为空时表示没有更多数据
      pageToken = response.data.data.page_token

      // 打印当前进度
      console.log(`已获取 ${allRecords.length} 条记录，下一页标记: ${pageToken || '无'}`)

    } while (pageToken) // 当有下一页标记时继续循环

    console.log(`所有记录获取完成，共 ${allRecords.length} 条`)
    return allRecords
  } catch (error) {
    console.error('分页获取记录失败:', error)
    throw error
  }
}

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
    
    // 调用分页函数获取所有记录（替换原有的单页获取逻辑）
    const records = await getAllRecords(token, APP_TOKEN, TABLE_ID)
    
    // 3. 列出视图:获取多维表格数据表中的所有视图
    const viewsResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/views`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (viewsResponse.data.code !== 0) {
      throw new Error(`获取视图失败: ${viewsResponse.data.msg}`)
    }
    
    const views = viewsResponse.data.data.items
    const categoryOrder = views.map((view: { view_name: string }) => view.view_name)
    
    // 处理记录数据
    const processedRecords = records.map((record: TableRecord) => ({
      ...record,
      fields: {
        ...record.fields,
        Category: Array.isArray(record.fields.Category) 
          ? record.fields.Category.filter(Boolean) // 过滤空值
          : record.fields.Category ? [record.fields.Category].filter(Boolean) : []
      }
    }));
    
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

    console.log('Sample processed link:', JSON.stringify(links[0], null, 2))
    console.log('共处理生成', links.length, '条有效链接')

    res.status(200).json({
      links,
      categoryOrder,
      debug: {
        sampleRawRecord: processedRecords[0],
        sampleProcessedLink: links[0],
        recordsCount: processedRecords.length, // 总记录数（所有分页）
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