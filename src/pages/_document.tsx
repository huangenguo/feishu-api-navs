import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const siteUrl = 'https://ai.616161.best'
  const siteName = '创客恩果的飞书导航站'
  const siteDescription = '一个简洁优雅的导航网站，收集了各种实用的工具和资源。'
  const siteKeywords = '导航,工具,资源,开发工具,设计资源'

  return (
    <Html lang="zh-CN">
      <Head>
        {/* 基本元信息 */}
        <meta charSet="utf-8" />
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content={siteKeywords} />
        <meta name="application-name" content={siteName} />
        <meta name="apple-mobile-web-app-title" content="飞书导航" />
        
        {/* 移动端优化 */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes" 
        />
        
        {/* Open Graph 标签 */}
        <meta property="og:title" content={siteName} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:site_name" content={siteName} />
        
        {/* 网站图标 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* PWA 相关 */}
        <meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 字体预加载 */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* 网站标题 */}
        <title>{siteName}</title>
        
        {/* Schema 结构化数据 - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": siteName,
              "url": siteUrl,
              "description": siteDescription,
              "keywords": siteKeywords,
              "author": {
                "@type": "Person",
                "name": "创客恩果"
              }
            })
          }}
        />
        
        {/* Schema 结构化数据 - WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": `首页 - ${siteName}`,
              "description": "浏览和搜索各类实用工具和资源链接",
              "url": siteUrl,
              "inLanguage": "zh-CN"
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
