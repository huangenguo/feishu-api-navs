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
// 获取多维表格元数据（包含多维表格名称）
// https://open.feishu.cn/document/server-docs/docs/bitable-v1/app/get
async function getAppMeta(token: string) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.code !== 0) {
      throw new Error(`获取多维表格元数据失败: ${response.data.msg}`)
    }
    return response.data.data.app
  } catch (error) {
    console.error('获取多维表格元数据失败:', error)
    throw error
  }
}

// 获取数据表列表（包含数据表名称）
// https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/list
async function getTableList(token: string) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.code !== 0) {
      throw new Error(`获取数据表列表失败: ${response.data.msg}`)
    }
    return response.data.data.items
  } catch (error) {
    console.error('获取数据表列表失败:', error)
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
async function getAllRecords(token: string) {
  const allRecords: any[] = []
  let pageToken = '' // 分页标记，初始为空表示第一页
  const pageSize = 100 // 每页最大条数（飞书API支持1-500）

  try {
    // 循环获取所有分页数据
    do {
      const response = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/search`,
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

    } while (pageToken) // 当有下一页标记时继续循环
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

// 从飞书多维表格字段值中提取文本内容
function extractText(value: any): string {
  if (Array.isArray(value) && value.length > 0) {
    if (typeof value[0] === 'object' && value[0].text !== undefined) {
      return value[0].text
    }
    return String(value[0])
  }
  if (typeof value === 'object' && value.text !== undefined) {
    return value.text
  }
  return typeof value === 'string' ? value : ''
}

// 从飞书多维表格字段值中提取链接
function extractUrl(value: any): string {
  if (typeof value === 'object' && value.link !== undefined) {
    return value.link
  }
  if (typeof value === 'object' && value.text !== undefined) {
    return value.text
  }
  if (Array.isArray(value) && value.length > 0) {
    if (typeof value[0] === 'object' && value[0].link !== undefined) {
      return value[0].link
    }
    if (typeof value[0] === 'object' && value[0].text !== undefined) {
      return value[0].text
    }
    return String(value[0])
  }
  return typeof value === 'string' ? value : ''
}

// API路由处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !APP_TOKEN || !TABLE_ID) {
      return res.status(500).json({
        error: 'Missing configuration',
        message: '请配置飞书API相关环境变量'
      })
    }

    const token = await getAccessToken()
    
    // 获取多维表格元数据和数据表列表
    const [appMeta, tables] = await Promise.all([
      getAppMeta(token),
      getTableList(token)
    ])
    
    // 调用分页函数获取所有记录（替换原有的单页获取逻辑）
    const records = await getAllRecords(token)
    
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
    const viewNames = views.map((view: { view_name: string }) => view.view_name)
    
    // 处理记录数据 - 支持飞书多维表格的数组格式字段
    const processedRecords = records.map((record: TableRecord) => {
      const fields = record.fields
      
      // 提取字段值，支持飞书多维表格的数组格式
      const title = extractText(fields.Title || fields['Title'] || fields['标题'] || fields['title'])
      const urlField = fields.URL || fields['URL'] || fields['链接'] || fields['url'] || {}
      const description = extractText(fields.Description || fields['Description'] || fields['描述'] || fields['description'])
      const category = fields.Category || fields['Category'] || fields['分类'] || fields['category'] || []
      const icon = extractText(fields.Icon || fields['Icon'] || fields['图标'] || fields['icon'])
      const recommend = extractText(fields.Recommend || fields['Recommend'] || fields['推荐'] || fields['recommend'])
      const order = fields.Order || fields['Order'] || fields['排序'] || fields['order'] || Number.MAX_SAFE_INTEGER
      const tags = fields.Tags || fields['Tags'] || fields['标签'] || fields['tags'] || []
      const status = extractText(fields.Status || fields['Status'] || fields['状态'] || fields['status'])

      return {
        ...record,
        fields: {
          Title: title,
          URL: urlField,
          Description: description,
          Category: Array.isArray(category)
            ? category.filter(Boolean)
            : category ? [category].filter(Boolean) : [],
          Icon: icon,
          Recommend: recommend,
          Order: order,
          Tags: Array.isArray(tags) ? tags.map(t => extractText(t)) : (tags ? [extractText(tags)] : []),
          Status: status
        }
      }
    });
    
    const links = processedRecords
      .filter((record: any) => {
        const hasTitle = typeof record.fields.Title === 'string' && record.fields.Title.trim() !== ''
        const urlValue = extractUrl(record.fields.URL)
        const hasUrl = urlValue && urlValue.trim() !== ''
        const hasDescription = typeof record.fields.Description === 'string' && record.fields.Description.trim() !== ''
        
        return hasTitle && hasUrl && hasDescription
      })
      .map((record: any) => {
        const url = extractUrl(record.fields.URL)
        
        return ({
          title: record.fields.Title || '',
          url: url,
          description: record.fields.Description || '',
          category: record.fields.Category || [],
          icon: record.fields.Icon || '',
          recommend: record.fields.Recommend || '',
          order: record.fields.Order ? parseInt(String(record.fields.Order), 10) : Number.MAX_SAFE_INTEGER,
          tags: record.fields.Tags || [],
          status: record.fields.Status || '',
          viewOrders: record.fields.Category?.reduce((acc: Record<string, number>, cat: string) => {
            acc[cat] = record.fields.Order ? parseInt(String(record.fields.Order), 10) : Number.MAX_SAFE_INTEGER
            return acc
          }, {}) || {}
        })
      })
      .sort((a: Link, b: Link) => a.order - b.order)

    const allCategories = Array.from(new Set(links.flatMap(link => link.category))).filter(Boolean)
    const categoryOrder = allCategories.length > 0 ? allCategories : viewNames

    res.status(200).json({
      links,
      categoryOrder,
      appInfo: {
        name: appMeta.name,
        revision: appMeta.revision,
        timeZone: appMeta.time_zone
      },
      tables: tables.map((table: any) => ({
        tableId: table.table_id,
        tableName: table.name,
        revision: table.revision
      }))
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