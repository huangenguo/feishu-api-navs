import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = 'https://ai.616161.best'
  
  try {
    // 定义站点的核心页面
    const corePages = [
      { loc: baseUrl, priority: '1.0', changefreq: 'daily' }
    ]
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corePages.map(url => `  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('\n')}
</urlset>`
    
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate')
    res.status(200).send(xml)
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    res.status(500).setHeader('Content-Type', 'application/xml')
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`)
  }
}
