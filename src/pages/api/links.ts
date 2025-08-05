// src/pages/api/links.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// 飞书API配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const APP_TOKEN = process.env.FEISHU_APP_TOKEN // bitable文档的唯一标识
const TABLE_ID = process.env.FEISHU_TABLE_ID   // 数据表的唯一标识id
const VIEW_ID = process.env.FEISHU_VIEW_ID     // 视图的唯一标识id

// 多维表格字段类型定义
interface TableRecord {
  id: string;
  fields: {
    title: string;                  // 链接标题（必填）
    url: string;                    // 链接地址（必填）
    description: string;            // 链接描述（必填）
    category: string[];             // 分类（数组）
    icon?: string;                  // 图标（可选）
    recommend?: string;             // 推荐标识（可选）
    order: number;                  // 排序序号
    tags: string[];                 // 标签（数组）
    [key: string]: any;             // 允许其他扩展字段
  };
}

// 视图信息类型
interface ViewInfo {
  view_id: string;
  view_name: string;
  view_type: string;
  [key: string]: any;
}

// 最终返回的链接类型（与多维表格字段对应）
interface Link {
  title: string;
  url: string;
  description: string;
  category: string[];
  icon?: string;
  recommend?: string;
  order: number;
  tags: string[];
  viewOrders: Record<string, number>;
}

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
): Promise<TableRecord[]> {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/views/${viewId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 1000,
          page_token: ''
        }
      }
    )
    
    if (response.data.code !== 0) {
      throw new Error(`获取视图记录失败: ${response.data.msg} (错误码: ${response.data.code})`)
    }
    
    let allRecords: TableRecord[] = response.data.data.items
    let nextPageToken = response.data.data.page_token
    
    // 处理分页
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
): Promise<ViewInfo> {
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
    // 验证环境变量
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
    const records: TableRecord[] = await getViewRecords(token, APP_TOKEN, TABLE_ID, VIEW_ID)
    console.log(`从视图中获取到 ${records.length} 条记录`)
    
    // 4. 提取所有分类并去重
    const allCategories = Array.from(
      new Set(records.flatMap(record => record.fields.category))
    ).filter(Boolean) // 过滤空值
    
    // 5. 转换为Link类型并过滤有效数据
    const links: Link[] = records
      // 严格过滤必填字段
      .filter((record) => 
        typeof record.fields.title === 'string' && 
        record.fields.title.trim() !== '' &&
        typeof record.fields.url === 'string' && 
        record.fields.url.trim() !== '' &&
        typeof record.fields.description === 'string' && 
        record.fields.description.trim() !== ''
      )
      .map((record) => ({
        title: record.fields.title.trim(),
        url: record.fields.url.trim(),
        description: record.fields.description.trim(),
        category: Array.isArray(record.fields.category) ? record.fields.category : [record.fields.category],
        icon: record.fields.icon?.trim() || undefined, // 确保空值为undefined
        recommend: record.fields.recommend?.trim() || undefined,
        order: typeof record.fields.order === 'number' ? record.fields.order : 0,
        tags: Array.isArray(record.fields.tags) ? record.fields.tags : [],
        viewOrders: record.fields.category.reduce((acc: Record<string, number>, cat: string) => {
          const catIndex = allCategories.indexOf(cat)
          acc[cat] = catIndex !== -1 ? catIndex : Number.MAX_SAFE_INTEGER
          return acc
        }, {})
      }))
      // 按order字段排序
      .sort((a, b) => a.order - b.order)

    // 返回处理后的数据
    res.status(200).json({
      links,
      viewName: viewInfo.view_name,
      categories: allCategories,
      stats: {
        totalRecords: records.length,
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
