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
    const token = await getAccessToken()
    
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
    
    console.log('=== 调试信息: 原始记录 ===')
    console.log('记录总数:', records.length)
    console.log('视图名称:', viewNames)
    if (records.length > 0) {
      console.log('第一条记录的所有字段:', Object.keys(records[0].fields))
      console.log('第一条记录完整数据:', JSON.stringify(records[0], null, 2))
    }
    
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
          Tags: Array.isArray(tags) ? tags.map(t => extractText(t)) : (tags ? [extractText(tags)] : [])
        }
      }
    });
    
    console.log('=== 调试信息: 处理后的记录 ===')
    if (processedRecords.length > 0) {
      console.log('第一条处理后记录:', JSON.stringify(processedRecords[0], null, 2))
    }
    
    const links = processedRecords
      .filter((record: any) => {
        const hasTitle = typeof record.fields.Title === 'string' && record.fields.Title.trim() !== ''
        const urlValue = extractUrl(record.fields.URL)
        const hasUrl = urlValue && urlValue.trim() !== ''
        const hasDescription = typeof record.fields.Description === 'string' && record.fields.Description.trim() !== ''
        
        if (!hasTitle || !hasUrl || !hasDescription) {
          console.log('记录被过滤:', {
            title: record.fields.Title,
            url: urlValue,
            description: record.fields.Description,
            hasTitle,
            hasUrl,
            hasDescription
          })
        }
        
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
          viewOrders: record.fields.Category?.reduce((acc: Record<string, number>, cat: string) => {
            acc[cat] = record.fields.Order ? parseInt(String(record.fields.Order), 10) : Number.MAX_SAFE_INTEGER
            return acc
          }, {}) || {}
        })
      })
      .sort((a: Link, b: Link) => a.order - b.order)

    console.log('=== 调试信息: 最终链接 ===')
    console.log('有效链接数:', links.length)
    if (links.length > 0) {
      console.log('第一条链接:', JSON.stringify(links[0], null, 2))
    }
    
    const allCategories = [...new Set(links.flatMap(link => link.category))].filter(Boolean)
    console.log('=== 调试信息: 所有分类 ===')
    console.log('记录中的分类:', allCategories)
    console.log('视图名称:', viewNames)
    
    const categoryOrder = allCategories.length > 0 ? allCategories : viewNames

    res.status(200).json({
      links,
      categoryOrder,
      debug: {
        sampleRawRecord: records[0],
        sampleProcessedLink: links[0],
        recordsCount: processedRecords.length,
        linksCount: links.length,
        rawFields: records.length > 0 ? Object.keys(records[0].fields) : [],
        allCategories,
        viewNames
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