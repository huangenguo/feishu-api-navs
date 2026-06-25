import { useEffect, useState, useRef } from 'react'

export function Footer() {
  const [uptime, setUptime] = useState('0天 0时 0分 0秒')
  const [visitorCount, setVisitorCount] = useState('---')
  const [pageViews, setPageViews] = useState('---')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const LAUNCH_DATE = new Date('2024-01-01 00:00:00').getTime()

  useEffect(() => {
    const updateUptime = () => {
      const now = Date.now()
      const diff = now - LAUNCH_DATE
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setUptime(`${days}天 ${hours}时 ${minutes}分 ${seconds}秒`)
    }

    updateUptime()
    timerRef.current = setInterval(updateUptime, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const updateStats = () => {
      const pvElement = document.getElementById('busuanzi_container_page_pv')
      const uvElement = document.getElementById('busuanzi_container_site_uv')
      
      if (pvElement) {
        const pvText = pvElement.textContent || ''
        const pvMatch = pvText.match(/\d+/)
        if (pvMatch) {
          setPageViews(pvMatch[0])
        }
      }
      
      if (uvElement) {
        const uvText = uvElement.textContent || ''
        const uvMatch = uvText.match(/\d+/)
        if (uvMatch) {
          setVisitorCount(uvMatch[0])
        }
      }
    }

    const busuanziLoaded = (window as any).__busuanziLoaded__
    
    if (busuanziLoaded) {
      setTimeout(updateStats, 100)
      setTimeout(updateStats, 1000)
      return
    }

    const existingScript = document.querySelector('script[src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"]')
    if (existingScript) {
      (window as any).__busuanziLoaded__ = true
      setTimeout(updateStats, 100)
      setTimeout(updateStats, 1000)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
    script.async = true
    
    script.onload = () => {
      (window as any).__busuanziLoaded__ = true
      setTimeout(updateStats, 500)
      setTimeout(updateStats, 1500)
    }
    
    script.onerror = () => {
      (window as any).__busuanziLoaded__ = true
    }
    
    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {}
    }
  }, [])

  return (
    <>
      <div id="busuanzi_container_site_uv" style={{ display: 'none' }}>
        <span id="busuanzi_value_site_uv">0</span>
      </div>
      <div id="busuanzi_container_page_pv" style={{ display: 'none' }}>
        <span id="busuanzi_value_page_pv">0</span>
      </div>
      
      <footer className="theme-bg border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {visitorCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                访问人数
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {pageViews}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                浏览次数
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {uptime}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                运行时间
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                v1.0.0
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                版本号
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} 飞书导航站. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  关于我们
                </a>
                <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  使用帮助
                </a>
                <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  联系我们
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer
