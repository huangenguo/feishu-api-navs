import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { Link } from '@/types'
import Loading from '@/components/Loading'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { IconBackground } from '@/components/IconBackground'
import { ClickStats } from '@/components/ClickStats'
import { ScrollNav } from '@/components/ScrollNav'
import { ClickStatsProvider, useClickStats } from '@/context/ClickStatsContext'
import DrawerSidebar, { DrawerToggle, NavItem } from '@/components/DrawerSidebar'

const gradientColors = [
  'from-pink-400 to-purple-400',
  'from-blue-400 to-cyan-400',
  'from-green-400 to-emerald-400',
  'from-yellow-400 to-orange-400',
  'from-purple-400 to-indigo-400',
  'from-red-400 to-pink-400',
]

// 热门标签阈值配置
const HOT_THRESHOLD = 3

function HomeContent() {
  const [links, setLinks] = useState<Link[]>([])
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeTag, setActiveTag] = useState<string>('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { recordClick, clickStats } = useClickStats()

  const navItems: NavItem[] = [
    {
      id: 'all',
      label: '全部',
    },
    ...categoryOrder.map(category => ({
      id: category,
      label: category,
    })),
  ]

  const handleDrawerOpen = () => {
    setIsDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  const handleNavItemClick = useCallback((item: NavItem) => {
    if (item.id === 'all') {
      setActiveCategory('')
    } else {
      setActiveCategory(item.id)
    }
    setActiveTag('')
    // 移动端：关闭抽屉后滚动到内容区域
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
  }, [contentRef])

  const handleLinkClick = (url: string, title: string) => {
    recordClick(url, title)
  }

  useEffect(() => {
    const fetchLinks = async () => {
      const loadStartTime = Date.now()
      try {
        const res = await axios.get('/api/links')
        setLinks(res.data.links)
        setCategoryOrder(res.data.categoryOrder)
      } catch (err) {
        setError('Failed to fetch links')
        console.error(err)
      } finally {
        const loadTime = Date.now() - loadStartTime
        if (loadTime < 500) {
          setTimeout(() => setLoading(false), 500 - loadTime)
        } else {
          setLoading(false)
        }
      }
    }
    
    fetchLinks()
  }, [])

  useEffect(() => {
    const savedHistoryStr = localStorage.getItem('searchHistory')
    if (savedHistoryStr) {
      let savedHistory
      try {
        savedHistory = JSON.parse(savedHistoryStr)
      } catch (e) {
        savedHistory = []
        localStorage.removeItem('searchHistory')
      }
      if (Array.isArray(savedHistory)) {
        setSearchHistory(savedHistory)
      }
    }
  }, [])

  const saveSearchHistory = (term: string) => {
    if (!term.trim()) return

    setSearchHistory(prev => {
      const newHistory = [term, ...prev.filter(h => h !== term)].slice(0, 10)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      return newHistory
    })
  }

  const removeHistoryItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchHistory(prev => {
      const newHistory = prev.filter(h => h !== term)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      return newHistory
    })
  }

  const clearAllHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      const target = e.target as HTMLElement
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    
    if (e.key === 'Escape') {
      setSearchTerm(prev => {
        if (prev) {
          setShowHistory(false)
          return ''
        }
        return prev
      })
      setShowHistory(false)
      searchInputRef.current?.blur()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getRandomGradient = (text: string) => {
    const index = text.charCodeAt(0) % gradientColors.length
    return gradientColors[index]
  }

  const getAllTags = (category: string) => {
    return Array.from(new Set(
      links
        .filter(link => !category || link.category.includes(category))
        .flatMap(link => link.tags)
    )).filter(Boolean)
  }

  const getGlobalTags = () => {
    return Array.from(new Set(
      links
        .filter(link => !link.status || link.status === '启用')
        .flatMap(link => link.tags)
    )).filter(Boolean)
  }

  if (loading) return <Loading />
  if (error) return <div>Error: {error}</div>

  const filteredLinks = links
    .filter(link => {
      const isStatusValid = !link.status || link.status === '启用'
      if (!isStatusValid) return false

      const matchesSearch =
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !activeCategory || link.category.includes(activeCategory)
      const matchesTag = !activeTag || link.tags.includes(activeTag)
      return matchesSearch && matchesCategory && matchesTag
    })
    .sort((a, b) => a.order - b.order)

  const groupedLinks = filteredLinks.reduce((groups, link) => {
    if (!activeCategory) {
      link.category.forEach(category => {
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(link)
      })
    } else {
      const cat = activeCategory
      if (!groups[cat]) {
        groups[cat] = []
      }
      if (link.category.includes(cat)) {
        groups[cat].push(link)
      }
    }
    return groups
  }, {} as Record<string, Link[]>)

  if (activeCategory) {
    Object.keys(groupedLinks).forEach(category => {
      groupedLinks[category].sort((a, b) => {
        if (a.order === b.order) {
          return a.title.localeCompare(b.title)
        }
        return a.order - b.order
      })
    })
  }

  const orderedCategories = activeCategory 
    ? [activeCategory]
    : categoryOrder.filter(cat => groupedLinks[cat] && groupedLinks[cat].length > 0)

  return (
    <div className="min-h-screen theme-bg">
      <DrawerSidebar
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onOpen={handleDrawerOpen}
        placement="left"
        width="w-80"
        navItems={navItems}
        activeItemId={activeCategory || 'all'}
        onItemClick={handleNavItemClick}
      />

      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 fixed top-0 left-0 h-screen p-6 theme-bg flex flex-col hidden lg:block">
          <div className="theme-bg-secondary rounded-xl shadow-sm border theme-border-color p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
            <button
              onClick={() => {
                setActiveCategory('')
                setActiveTag('')
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left
                ${!activeCategory 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'theme-text-secondary theme-hover-bg'}`}
            >
              全部
            </button>
            {categoryOrder.map(category => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category)
                  setActiveTag('')
                }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left
                  ${activeCategory === category
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'theme-text-secondary theme-hover-bg'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 p-6 lg:ml-60">
          <div className="rounded-xl shadow-lg p-6 mb-6 relative
            bg-gradient-to-r from-blue-500 to-indigo-600
            dark:from-zinc-900 dark:to-black"
          >
            <IconBackground />
            
            <div className="absolute top-4 left-4 z-20 lg:hidden">
              <DrawerToggle onClick={handleDrawerOpen} />
            </div>

            <div className="absolute top-4 right-4 z-20">
              <div className="flex items-center gap-4">
                <div className="p-1">
                  <ThemeSwitch />
                </div>
                <div className="p-1">
                  <a
                    href="https://github.com/huangenguo/feishu-api-navs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors duration-200 block"
                    title="View on GitHub"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-4 relative z-10">
              创客恩果的飞书导航站
            </h1>
            
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="relative group">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索资源标题、描述或链接..."
                  className="w-full px-6 py-4 pl-14 pr-12 rounded-full
                    bg-white/90 backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-white/20
                    text-lg text-slate-800 placeholder-slate-400
                    shadow-lg shadow-black/5"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveSearchHistory(searchTerm)
                      setShowHistory(false)
                    }
                  }}
                />
                <svg
                  className="absolute left-5 top-4 h-6 w-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-100 text-slate-500 text-sm font-medium">
                  /
                </div>

                {showHistory && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-600">搜索历史</span>
                      <button
                        onClick={clearAllHistory}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        清空
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {searchHistory.map((term) => (
                        <div
                          key={term}
                          className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 cursor-pointer group"
                          onClick={() => {
                            setSearchTerm(term)
                            setShowHistory(false)
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-slate-700 truncate">{term}</span>
                          </div>
                          <button
                            onClick={(e) => removeHistoryItem(term, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="max-w-2xl mx-auto mt-4 flex flex-wrap gap-2">
              {getGlobalTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${activeTag === tag
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'bg-white/30 text-white/80 hover:bg-white/40'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {activeCategory && (
            <div className="flex items-center gap-6 mb-6">
              <h2 className="text-xl font-bold theme-text-primary">
                {activeCategory}
              </h2>
              
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTag('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium
                    transition-colors duration-200
                    ${!activeTag
                      ? 'bg-blue-100 text-blue-700'
                      : 'theme-text-secondary theme-hover-bg'}`}
                >
                  全部
                </button>
                {getAllTags(activeCategory).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium
                      transition-colors duration-200
                      ${activeTag === tag
                        ? 'bg-blue-100 text-blue-700'
                        : 'theme-text-secondary theme-hover-bg'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-8" ref={contentRef}>
            {searchTerm && filteredLinks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 theme-bg-secondary rounded-xl">
                <svg
                  className="w-16 h-16 text-slate-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg font-medium theme-text-primary mb-2">未找到相关资源</p>
                <p className="text-sm theme-text-secondary">尝试使用其他关键词搜索</p>
              </div>
            )}

            {orderedCategories.map(category => (
              <div key={category}>
                {!activeCategory && (
                  <h3 className="text-lg font-medium theme-text-primary mb-4">{category}</h3>
                )}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {groupedLinks[category]?.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 theme-bg-secondary rounded-xl border theme-border-color
                        hover:border-blue-500/10
                        transform hover:-translate-y-1
                        transition-all duration-300
                        relative"
                      onClick={() => handleLinkClick(link.url, link.title)}
                    >
                      {/* 标签容器 - 使用 flex 布局排列多个标签 */}
                      {(link.recommend || (clickStats[link.url]?.count || 0) >= HOT_THRESHOLD) && (
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          {/* 热门标签 */}
                          {(clickStats[link.url]?.count || 0) >= HOT_THRESHOLD && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium
                              bg-gradient-to-r from-orange-500 to-red-500
                              text-white rounded-full shadow-sm
                              flex items-center gap-0.5"
                            >
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"/>
                              </svg>
                              热门
                            </span>
                          )}
                          {/* 推荐标签 */}
                          {link.recommend && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium
                              bg-gradient-to-r from-blue-500 to-purple-500
                              text-white rounded-full shadow-sm
                              flex items-center gap-0.5"
                            >
                              <svg
                                className="w-2.5 h-2.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {link.recommend}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center
                          theme-icon-bg
                          transition-transform duration-300"
                        >
                          {link.icon ? (
                            <img
                              src={link.icon}
                              alt=""
                              className="w-6 h-6 object-contain 
                                group-hover:scale-110 
                                transition-transform duration-300"
                            />
                          ) : (
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center
                              text-lg font-medium text-white
                              group-hover:scale-110
                              transition-transform duration-300
                              bg-gradient-to-br ${getRandomGradient(link.title)}`}
                            >
                              {link.title.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-7">
                          <h3 
                            className="font-medium theme-text-primary
                              text-[15px] mb-2 leading-relaxed
                              line-clamp-2"
                            title={link.title}
                          >
                            {link.title}
                          </h3>
                          <p 
                            className="text-[13px] theme-text-description leading-relaxed
                              line-clamp-2"
                            title={link.description}
                          >
                            {link.description}
                          </p>
                          {link.tags && link.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {link.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-[11px] rounded-md
                                    bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <svg 
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4
                            text-slate-400 opacity-0 group-hover:opacity-100 
                            -translate-x-2 group-hover:translate-x-0
                            transition-all duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M14 5l7 7m0 0l-7 7m7-7H3" 
                          />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ClickStats />

      <ScrollNav />

      {/* 底部签名档 */}
      <footer className="mt-12 mb-8 px-6">
        <div className="max-w-6xl mx-auto rounded-xl p-6
          bg-gradient-to-r from-slate-800 to-slate-900
          dark:from-zinc-900 dark:to-black">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {/* B站 */}
            <a
              href="https://space.bilibili.com/32828583"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <span className="text-2xl">📺</span>
              <div>
                <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                  B站
                </div>
                <div className="text-slate-400 text-xs">创客作品视频与教学演示</div>
              </div>
            </a>

            {/* 教育技术自留地 */}
            <a
              href="https://616161.best/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <span className="text-2xl">📔</span>
              <div>
                <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                  教育技术自留地
                </div>
                <div className="text-slate-400 text-xs">个人博客</div>
              </div>
            </a>

            {/* EdTech 教育技术导航 */}
            <a
              href="https://123.616161.best/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <span className="text-2xl">🧭</span>
              <div>
                <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                  EdTech 教育技术导航
                </div>
                <div className="text-slate-400 text-xs">教育资源聚合导航站</div>
              </div>
            </a>

            {/* 潮汕信息网 */}
            <a
              href="https://cs.616161.best/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <span className="text-2xl">🌏</span>
              <div>
                <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                  潮汕信息网
                </div>
                <div className="text-slate-400 text-xs">潮汕地区综合信息服务平台</div>
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <ClickStatsProvider>
      <HomeContent />
    </ClickStatsProvider>
  )
}
