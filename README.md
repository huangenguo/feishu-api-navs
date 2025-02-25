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
| FEISHU_TABLE_ID | 飞书多维表格 ID | tblxxxx |

## 开发说明

1. 修改样式：
   - 编辑 `src/pages/index.tsx` 中的 Tailwind 类名
   - 或在 `src/styles/globals.css` 添加自定义样式

2. 修改布局：
   - 编辑 `src/pages/index.tsx` 中的 JSX 结构

3. 添加新功能：
   - 在 `src/pages/api/` 添加新的 API 路由
   - 在 `src/components/` 添加新组件

## License

MIT


