import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://ai.616161.best'
  
  try {
    // 定义站点的核心页面
    const corePages = [
      { loc: baseUrl, priority: '1.0', changefreq: 'daily' }
    ]
    
    // 生成sitemap内容
    const urls = [
      ...corePages
    ]
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('\n')}
</urlset>`
    
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.write(xml)
    res.end()
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/xml')
    res.write(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`)
    res.end()
  }
  
  return { props: {} }
}

export default function Sitemap() {
  return null
}
