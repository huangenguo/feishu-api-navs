import { useState, useEffect, useRef, createElement } from 'react'
import { useClickStats, ClickRecord, RecentClick } from '@/hooks/useClickStats'

interface ModalProps {
  show: boolean
  onClose: () => void
  onConfirm: () => void
}

function ClearConfirmModal({ show, onClose, onConfirm }: ModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let div = document.getElementById('modal-root') as HTMLDivElement
    if (!div) {
      div = document.createElement('div')
      div.id = 'modal-root'
      document.body.appendChild(div)
    }
    containerRef.current = div

    return () => {
      if (div && div.parentNode && !div.firstChild) {
        div.parentNode.removeChild(div)
      }
    }
  }, [])

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  if (!show || !containerRef.current) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="theme-bg-secondary rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border theme-border-color">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium theme-text-primary mb-2">确认清空？</h3>
          <p className="text-sm theme-text-description mb-6">清空后所有点击记录将被删除，此操作不可撤销。</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg theme-text-secondary theme-hover-bg text-sm font-medium">
              取消
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
              确认清空
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined' && containerRef.current) {
    const ReactDOM = require('react-dom')
    return ReactDOM.createPortal(modalContent, containerRef.current)
  }

  return modalContent
}

type TabType = 'hot' | 'recent'

export function ClickStats() {
  const { getHotClicks, getRecentClicks, clearStats } = useClickStats()
  const [activeTab, setActiveTab] = useState<TabType>('hot')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const hotClicks = getHotClicks(5)
  const recentClicks = getRecentClicks()

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return minutes + '分钟前'
    if (hours < 24) return hours + '小时前'
    if (days < 30) return days + '天前'
    
    const date = new Date(timestamp)
    return (date.getMonth() + 1) + '/' + date.getDate()
  }

  const handleClear = () => {
    clearStats()
    setShowClearConfirm(false)
  }

  const renderHotItem = (item: ClickRecord, index: number) => {
    let badgeClass = 'theme-icon-bg theme-text-secondary'
    if (index === 0) badgeClass = 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white'
    else if (index === 1) badgeClass = 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
    else if (index === 2) badgeClass = 'bg-gradient-to-br from-orange-300 to-orange-400 text-white'

    return (
      <a
        key={item.url}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-lg theme-hover-bg group"
      >
        <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 " + badgeClass}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-medium theme-text-primary truncate group-hover:text-blue-600 transition-colors">
            {item.title}
          </span>
          <span className="text-xs theme-text-description">点击 {item.count} 次</span>
        </div>
        <svg
          className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )
  }

  const renderRecentItem = (item: RecentClick, index: number) => (
    <a
      key={item.url}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg theme-hover-bg group"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center theme-icon-bg shrink-0">
        <svg className="w-4 h-4 theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium theme-text-primary truncate group-hover:text-blue-600 transition-colors">
          {item.title}
        </span>
        <span className="text-xs theme-text-description">{formatTime(item.clickTime)}</span>
      </div>
      <svg
        className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )

  const getTabClass = (tab: TabType) => {
    const base = 'flex-1 px-4 py-2.5 text-sm font-medium transition-colors'
    if (activeTab === tab) return base + ' theme-text-primary border-b-2 border-blue-500'
    return base + ' theme-text-secondary hover:theme-text-primary'
  }

  return (
    <div className="theme-bg-secondary rounded-xl border theme-border-color overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b theme-border-color">
        <div className="flex items-center gap-1">
          <svg className="w-5 h-5 theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-medium theme-text-primary">点击统计</span>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
        >
          清空记录
        </button>
      </div>

      <div className="flex border-b theme-border-color">
        <button onClick={() => setActiveTab('hot')} className={getTabClass('hot')}>
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            热门点击
          </span>
        </button>
        <button onClick={() => setActiveTab('recent')} className={getTabClass('recent')}>
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            最近点击
          </span>
        </button>
      </div>

      <div className="p-3">
        {activeTab === 'hot' ? (
          hotClicks.length > 0 ? (
            <div className="space-y-1">
              {hotClicks.map((item, index) => renderHotItem(item, index))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm theme-text-description">暂无热门点击记录</p>
              <p className="text-xs theme-text-secondary mt-1">点击导航链接后将显示在此处</p>
            </div>
          )
        ) : (
          recentClicks.length > 0 ? (
            <div className="space-y-1">
              {recentClicks.map((item, index) => renderRecentItem(item, index))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm theme-text-description">暂无最近点击记录</p>
              <p className="text-xs theme-text-secondary mt-1">点击导航链接后将显示在此处</p>
            </div>
          )
        )}
      </div>

      <ClearConfirmModal 
        show={showClearConfirm} 
        onClose={() => setShowClearConfirm(false)} 
        onConfirm={handleClear} 
      />
    </div>
  )
}
