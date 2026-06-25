import { useEffect, useState, useRef } from 'react'

export function Footer() {
  const [years, setYears] = useState(0)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [siteUV, setSiteUV] = useState<string>('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const busuanziTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const LAUNCH_DATE = new Date('2025-08-05T17:30:00').getTime()

  useEffect(() => {
    const updateUptime = () => {
      const now = Date.now()
      const diff = now - LAUNCH_DATE
      
      if (diff < 0) return
      
      const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
      const days = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diff % (60 * 1000)) / 1000)
      
      setYears(years)
      setDays(days)
      setHours(hours)
      setMinutes(minutes)
      setSeconds(seconds)
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
    const scriptSrc = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
    
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`)
    
    const fetchBusuanziValue = () => {
      const uvElement = document.getElementById('busuanzi_value_site_uv')
      if (uvElement && uvElement.textContent !== 'Calculating...') {
        setSiteUV(uvElement.textContent || '')
      }
    }

    if (existingScript) {
      fetchBusuanziValue()
      busuanziTimerRef.current = setInterval(fetchBusuanziValue, 5000)
      return
    }

    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.onload = () => {
      fetchBusuanziValue()
      busuanziTimerRef.current = setInterval(fetchBusuanziValue, 5000)
    }
    document.body.appendChild(script)
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      if (busuanziTimerRef.current) {
        clearInterval(busuanziTimerRef.current)
      }
    }
  }, [])

  return (
    <footer className="text-center py-6 text-sm theme-text-secondary border-t theme-border-color mt-auto">
      <div>
        <span id="busuanzi_container_site_uv">朋友到访 <span id="busuanzi_value_site_uv">{siteUV || '...'}</span> 次</span>
        <span className="mx-2">.</span>
        小站已运行 <span>{years}</span> 年 <span>{days}</span> 天 <span>{hours}</span> 时 <span>{minutes}</span> 分 <span>{seconds}</span> 秒
      </div>
    </footer>
  )
}

export default Footer
