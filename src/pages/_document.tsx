import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="zh">
      <Head>
        {/* 基本元信息 */}
        <meta charSet="utf-8" />
        <meta name="description" content="一个简洁优雅的导航网站，收集了各种实用的工具和资源。" />
        <meta name="keywords" content="导航,工具,资源,开发工具,设计资源" />
        
        {/* Open Graph 标签 */}
        <meta property="og:title" content="iTools - 简洁优雅的导航网站" />
        <meta property="og:description" content="一个简洁优雅的导航网站，收集了各种实用的工具和资源。" />
        <meta property="og:type" content="website" />
        
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
        <title>iTools - 简洁优雅的导航网站</title>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 