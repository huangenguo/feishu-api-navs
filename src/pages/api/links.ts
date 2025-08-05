// src/pages/api/links.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { Link } from '@/types'

// 飞书API配置 - 使用明确区分的环境变量
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const APP_TOKEN = process.env.FEISHU_APP_TOKEN // bitable文档的唯一标识
const TABLE_ID = process.env.FEISHU_TABLE_ID   // 数据表的唯一标识id
const VIEW_ID = process.env.FEISHU_VIEW_ID     // 视图的唯一标识id

// 获取访问令牌
async function getAccessToken(): Promise<string> {
  try {
    const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    })
    
    if (res.data.code !== 0) {
      throw new Error(`获取令牌失败: ${res.data.msg}`)
    }
    
    return res.data.tenant_access_token
  } catch (error) {
    console.error('获取访问令牌失败:', error)
    throw error
  }
}

// 获取指定视图中的记录
async function getViewRecords(
  token: string, 
  appToken: string, 
  tableId: string, 
  viewId: string
) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/views/${viewId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 1000, // 最大分页大小
          page_token: ''
        }
      }
    )
    
    if (response.data.code !== 0) {
      throw new Error(`获取视图记录失败: ${response.data.msg} (错误码: ${response.data.code})`)
    }
    
    // 处理分页数据
    let allRecords = response.data.data.items
    let nextPageToken = response.data.data.page_token
    
    // 如果有更多数据，继续获取
    while (nextPageToken) {
      const nextResponse = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/views/${viewId}/records`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            page_size: 1000,
            page_token: nextPageToken
          }
        }
      )
      
      allRecords = [...allRecords, ...nextResponse.data.data.items]
      nextPageToken = nextResponse.data.data.page_token
    }
    
    return allRecords
  } catch (error) {
    console.error('获取视图记录失败:', error)
    throw error
  }
}

// 获取指定视图信息
async function getViewInfo(
  token: string,
  appToken: string,
  tableId: string,
  viewId: string
) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/views/${viewId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.data.code !== 0) {
      throw new Error(`获取视图信息失败: ${response.data.msg}`)
    }
    
    return response.data.data
  } catch (error) {
    console.error('获取视图信息失败:', error)
    throw error
  }
}

// API路由处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证环境变量 - 检查所有必要的配置
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
      return res.status(500).json({ 
        error: '配置错误', 
        message: '请检查飞书应用ID和密钥是否正确配置' 
      })
    }
    
    if (!APP_TOKEN) {
      return res.status(500).json({ 
        error: '配置错误', 
        message: '请配置飞书多维表格应用Token (FEISHU_APP_TOKEN)' 
      })
    }
    
    if (!TABLE_ID) {
      return res.status(500).json({ 
        error: '配置错误', 
        message: '请配置飞书数据表ID (FEISHU_TABLE_ID)' 
      })
    }
    
    if (!VIEW_ID) {
      return res.status(500).json({ 
        error: '配置错误', 
        message: '请配置飞书视图ID (FEISHU_VIEW_ID)' 
      })
    }
    
    // 1. 获取访问令牌
    const token = await getAccessToken()
    
    // 2. 获取视图信息
    const viewInfo = await getViewInfo(token, APP_TOKEN, TABLE_ID, VIEW_ID)
    console.log(`使用视图: ${viewInfo.view_name} (ID: ${VIEW_ID})`)
    
    // 3. 获取指定视图中的记录
    const records = await getViewRecords(token, APP_TOKEN, TABLE_ID, VIEW_ID)
    console.log(`从视图中获取到 ${records.length} 条记录`)
    
    // 4. 处理记录数据
    const processedRecords = records.map((record: TableRecord) => ({
      ...record,
      fields: {
        ...record.fields,
        // 确保Category是数组类型
        Category: Array.isArray(record.fields.Category) 
          ? record.fields.Category 
          : record.fields.Category ? [record.fields.Category] : []
      }
    }));
    
    // 5. 提取所有分类并保持唯一
    const allCategories = Array.from(
      new Set(processedRecords.flatMap(record => 
        Array.isArray(record.fields.Category) ? record.fields.Category : [record.fields.Category]
      ).filter(Boolean))
    )
    
    // 6. 转换为Link类型并过滤有效数据
    const links: Link[] = processedRecords
      .filter((record) => 
        record.fields.Title && 
        record.fields.URL && 
        record.fields.Description
      )
      .map((record) => ({
        title: record.fields.Title || '',
        url: record.fields.URL?.link || record.fields.URL?.text || '',
        description: record.fields.Description || '',
        category: record.fields.Category || [],
        icon: record.fields.Icon || '',
        recommend: record.fields.Recommend || '',
        order: record.fields.Order ? parseInt(record.fields.Order.toString(), 10) : Number.MAX_SAFE_INTEGER,
        tags: Array.isArray(record.fields.Tags) ? record.fields.Tags : [],
        viewOrders: record.fields.Category?.reduce((acc: Record<string, number>, cat: string) => {
          const catIndex = allCategories.indexOf(cat)
          acc[cat] = catIndex !== -1 ? catIndex : Number.MAX_SAFE_INTEGER
          return acc
        }, {}) || {}
      }))
      .sort((a, b) => a.order - b.order)

    // 返回处理后的数据
    res.status(200).json({
      links,
      viewName: viewInfo.view_name,
      categories: allCategories,
      stats: {
        totalRecords: processedRecords.length,
        validLinks: links.length,
        totalCategories: allCategories.length
      }
    })
    
  } catch (error: any) {
    console.error('API错误:', error)
    res.status(500).json({ 
      error: '获取数据失败',
      message: error.message || '未知错误',
      details: error.response?.data || null
    })
  }
}
