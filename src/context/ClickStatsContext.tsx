import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface ClickRecord {
  url: string
  title: string
  count: number
  lastClickTime: number
}

export interface RecentClick {
  url: string
  title: string
  clickTime: number
}

interface ClickStatsContextType {
  clickStats: Record<string, ClickRecord>
  recentClicks: RecentClick[]
  recordClick: (url: string, title: string) => void
  getHotClicks: (limit?: number) => ClickRecord[]
  getRecentClicks: () => RecentClick[]
  clearStats: () => void
}

const ClickStatsContext = createContext<ClickStatsContextType | undefined>(undefined)

const CLICK_STATS_KEY = 'click_stats'
const RECENT_CLICKS_KEY = 'recent_clicks'
const MAX_RECENT_CLICKS = 10

export function ClickStatsProvider({ children }: { children: ReactNode }) {
  const [clickStats, setClickStats] = useState<Record<string, ClickRecord>>({})
  const [recentClicks, setRecentClicks] = useState<RecentClick[]>([])

  // 初始化加载 localStorage 数据
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem(CLICK_STATS_KEY)
      const storedRecent = localStorage.getItem(RECENT_CLICKS_KEY)
      
      if (storedStats) {
        setClickStats(JSON.parse(storedStats))
      }
      if (storedRecent) {
        setRecentClicks(JSON.parse(storedRecent))
      }
    } catch (e) {
      console.error('Failed to load click stats from localStorage:', e)
    }
  }, [])

  // 同步到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CLICK_STATS_KEY, JSON.stringify(clickStats))
      localStorage.setItem(RECENT_CLICKS_KEY, JSON.stringify(recentClicks))
    } catch (e) {
      console.error('Failed to save click stats to localStorage:', e)
    }
  }, [clickStats, recentClicks])

  const recordClick = useCallback((url: string, title: string) => {
    const now = Date.now()

    setClickStats(prev => {
      const existing = prev[url]
      return {
        ...prev,
        [url]: {
          url,
          title,
          count: (existing?.count || 0) + 1,
          lastClickTime: now
        }
      }
    })

    setRecentClicks(prev => {
      const filtered = prev.filter(c => c.url !== url)
      const newRecent: RecentClick = { url, title, clickTime: now }
      return [newRecent, ...filtered].slice(0, MAX_RECENT_CLICKS)
    })
  }, [])

  const getHotClicks = useCallback((limit = 5) => {
    return Object.values(clickStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }, [clickStats])

  const getRecentClicks = useCallback(() => {
    return recentClicks
  }, [recentClicks])

  const clearStats = useCallback(() => {
    setClickStats({})
    setRecentClicks([])
  }, [])

  return (
    <ClickStatsContext.Provider value={{
      clickStats,
      recentClicks,
      recordClick,
      getHotClicks,
      getRecentClicks,
      clearStats
    }}>
      {children}
    </ClickStatsContext.Provider>
  )
}

export function useClickStats() {
  const context = useContext(ClickStatsContext)
  if (context === undefined) {
    throw new Error('useClickStats must be used within a ClickStatsProvider')
  }
  return context
}