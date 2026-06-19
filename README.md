# 飞书导航站点

基于飞书多维表格的导航网站，使用 Next.js 构建。通过飞书多维表格管理导航链接，自动同步到网站显示。

## 功能特点

- 🔄 实时同步飞书多维表格数据
- 📱 响应式布局，支持移动端
- 🏷️ 支持分类展示
- ⭐ 支持推荐标记
- 🔢 支持自定义排序
- 🖼️ 支持图标显示

## 技术栈

- Next.js 13
- TypeScript
- Tailwind CSS
- 飞书开放 API
- Vercel 部署

## 快速开始

### 1. 飞书配置

1. 创建飞书多维表格，包含以下字段：
   - Title (文本)
   - URL (链接)
   - Description (文本)
   - Category (单选)
   - Icon (文本，可选)
   - Recommend (文本，可选)
   - Order (数字，可选)

2. 在[飞书开发者平台](https://open.feishu.cn/app)创建应用：
   - 创建企业自建应用
   - 获取 App ID 和 App Secret
   - 开启多维表格权限：`bitable:app`，`bitable:table`

### 2. 本地开发

1. 克隆项目：

```bash
git clone https://github.com/yourusername/feishu-navigation.git
cd feishu-navigation
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量，创建 `.env.local` 文件：

```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_APP_TOKEN=your_app_token
FEISHU_TABLE_ID=your_table_id
```

4. 启动开发服务器：

```bash
npm run dev
```


### 3. Vercel 部署

1. Fork 本项目到你的 GitHub

2. 在 Vercel 中导入项目：
   - 登录 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 配置环境变量：
     * `FEISHU_APP_ID`
     * `FEISHU_APP_SECRET`
     * `FEISHU_APP_TOKEN`
     * `FEISHU_TABLE_ID`
   - 点击 "Deploy"

## 项目结构

```bash
nav-site/
├── src/
│ ├── pages/
│ │ ├── api/
│ │ │ └── links.ts # 飞书 API 处理
│ │ ├── app.tsx
│ │ └── index.tsx # 主页面
│ ├── components/
│ │ └── Loading.tsx # 加载组件
│ ├── styles/
│ │ └── globals.css # 全局样式
│ └── types/
│ └── index.ts # 类型定义
├── public/
├── .env.local # 本地环境变量
├── vercel.json # Vercel 配置
└── package.json
```


## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| FEISHU_APP_ID | 飞书应用 ID | cli_xxxx |
| FEISHU_APP_SECRET | 飞书应用密钥 | xxxx |
| FEISHU_APP_TOKEN | 飞书多维表格 App Token | 一个由数字和字母组成的26位字符串 |
| FEISHU_TABLE_ID | 飞书多维表格数据表 ID | tblxxxx |

## 开发说明

1. 修改样式：
   - 编辑 `src/pages/index.tsx` 中的 Tailwind 类名
   - 或在 `src/styles/globals.css` 添加自定义样式

2. 修改布局：
   - 编辑 `src/pages/index.tsx` 中的 JSX 结构

3. 添加新功能：
   - 在 `src/pages/api/` 添加新的 API 路由
   - 在 `src/components/` 添加新组件

## API 说明

本项目通过飞书开放 API 获取多维表格数据，主要涉及以下 API 端点：

### 认证接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/open-apis/auth/v3/tenant_access_token/internal` | POST | 获取 tenant_access_token |

### 多维表格接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search` | POST | 搜索记录（支持分页） |
| `/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/views` | GET | 获取视图列表 |

### 字段格式说明

飞书多维表格 API 返回的字段值可能为以下格式：

```
// 文本类型字段
"Title": [{"text": "内容", "type": "text"}]

// 链接类型字段
"URL": [{"link": "https://example.com", "type": "url"}]

// 多选类型字段
"Category": ["分类1", "分类2"]
```

## 飞书官方资源

- [飞书开放平台](https://open.feishu.cn/) - 飞书开放平台首页
- [多维表格 API 文档](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list) - 多维表格记录 API
- [飞书开发者控制台](https://open.feishu.cn/app) - 创建和管理飞书应用
- [多维表格权限说明](https://open.feishu.cn/document/server-docs/docs/bitable-v1/permission) - 权限配置指南

## 其他资源

- [Next.js 官方文档](https://nextjs.org/docs) - Next.js 框架文档
- [Vercel 部署文档](https://vercel.com/docs) - Vercel 平台部署指南
- [Tailwind CSS 文档](https://tailwindcss.com/docs) - Tailwind CSS 样式框架
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/) - TypeScript 类型系统

## License

MIT


