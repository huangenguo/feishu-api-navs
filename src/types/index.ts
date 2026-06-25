export interface Link {
  title: string;          // 链接标题（如"百度搜索"）
  url: string;            // 链接地址（如"https://baidu.com"）
  description: string;    // 链接描述（如"国内常用搜索引擎"）
  category: string[];     // 链接所属分类（如["工具", "搜索"]，支持多分类）
  icon?: string;          // 可选：链接图标（如"🔍"或图标名称）
  recommend?: string;     // 可选：推荐标识（如"推荐""热门"，为空表示非推荐）
  order: number;          // 排序序号（数字越小越靠前，用于控制展示顺序）
  tags: string[];         // 标签列表（如["实用", "常用"]，用于精细化分类）
  viewOrders: Record<string, number>;  // 不同分类下的排序权重（键为分类名，值为排序号）
  status?: string;        // 可选：状态字段（为空或"启用"时显示，"禁用"时不显示）
}

export interface AppInfo {
  name: string;           // 多维表格名称
  revision: number;       // 版本号
  timeZone: string;       // 时区
}

export interface TableInfo {
  tableId: string;        // 数据表ID
  tableName: string;      // 数据表名称
  revision: number;       // 版本号
  total?: number;         // 记录总数
}
