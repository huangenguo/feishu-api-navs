import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { Link, AppInfo, TableInfo } from '@/types'
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
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [activeTableId, setActiveTableId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeTag, setActiveTag] = useState<string>('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  // 展开的数据表ID列表（统一管理桌面端和移动端的展开状态）
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { recordClick, clickStats } = useClickStats()

  // 构建侧边栏导航项：数据表作为分组，分类作为子项
  const navItems: NavItem[] = useMemo(() => tables.map(table => ({
    id: table.tableId,
    label: table.tableName,
    children: categoryOrder.map(category => ({
      id: `${table.tableId}:${category}`,
      label: category,
    })),
  })), [tables, categoryOrder])

  const handleDrawerOpen = () => {
    setIsDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  // 获取指定数据表的数据
  const fetchTableData = useCallback(async (tableId: string) => {
    setTableLoading(true)
    setActiveCategory('')
    setActiveTag('')
    try {
      const res = await axios.get(`/api/links?table_id=${tableId}`)
      setLinks(res.data.links)
      setCategoryOrder(res.data.categoryOrder)
    } catch (err) {
      setError('Failed to fetch table data')
      console.error(err)
    } finally {
      setTableLoading(false)
    }
  }, [setLinks, setCategoryOrder, setError, setTableLoading, setActiveCategory, setActiveTag])

  const handleNavItemClick = useCallback((item: NavItem) => {
    // 检查是否是数据表项（没有 children）
    const isTableItem = tables.some(t => t.tableId === item.id)
    
    if (isTableItem) {
      // 点击数据表：切换展开状态
      setExpandedTableIds(prev => {
        if (prev.includes(item.id)) {
          // 已展开，点击后折叠（清除分类）
          setActiveCategory('')
          return prev.filter(id => id !== item.id)
        } else {
          // 未展开，点击后展开该数据表（同时收起其他数据表）
          setActiveCategory('')
          return [item.id]
        }
      })
      setActiveTableId(item.id)
      fetchTableData(item.id)
    } else if (item.id.includes(':')) {
      // 点击分类：格式为 "tableId:category"
      const [tableId, category] = item.id.split(':')
      if (tableId !== activeTableId) {
        setActiveTableId(tableId)
        fetchTableData(tableId).then(() => {
          setActiveCategory(category)
        })
        // 确保该数据表处于展开状态
        setExpandedTableIds(prev => {
          if (!prev.includes(tableId)) {
            return [...prev.filter(id => tables.some(t => t.tableId === id)), tableId]
          }
          return prev
        })
      } else {
        setActiveCategory(category)
      }
    }
    
    setActiveTag('')
    // 移动端：关闭抽屉后滚动到内容区域
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
  }, [contentRef, activeTableId, tables, fetchTableData])

  const handleLinkClick = (url: string, title: string) => {
    recordClick(url, title)
  }

  // 响应式断点优化：从移动端切换到桌面端时自动关闭抽屉
  useEffect(() => {
    const handleResize = () => {
      // lg 及以上屏幕宽度（1024px），自动关闭抽屉
      if (window.innerWidth >= 1024 && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isDrawerOpen])

  useEffect(() => {
    const fetchInitialData = async () => {
      const loadStartTime = Date.now()
      try {
        // 先获取数据表列表和应用信息
        const res = await axios.get('/api/links')
        setAppInfo(res.data.appInfo)
        setTables(res.data.tables || [])
        
        // 默认选中第一个数据表并加载其数据
        if (res.data.tables && res.data.tables.length > 0) {
          const firstTableId = res.data.tables[0].tableId
          setActiveTableId(firstTableId)
          // 加载第一个数据表的数据
          const tableRes = await axios.get(`/api/links?table_id=${firstTableId}`)
          setLinks(tableRes.data.links)
          setCategoryOrder(tableRes.data.categoryOrder)
        } else {
          // 如果没有数据表，使用默认数据
          setLinks(res.data.links)
          setCategoryOrder(res.data.categoryOrder)
        }
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
    
    fetchInitialData()
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

  const siteName = appInfo?.name || '创客恩果的飞书导航站'

  return (
    <>
      <Head>
        <title>{siteName}</title>
        <meta property="og:title" content={siteName} />
      </Head>
      <div className="min-h-screen theme-bg">
      <DrawerSidebar
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onOpen={handleDrawerOpen}
        placement="left"
        width="w-80"
        navItems={navItems}
        activeItemId={activeCategory ? `${activeTableId}:${activeCategory}` : activeTableId}
        expandedItemIds={expandedTableIds}
        onExpandedChange={setExpandedTableIds}
        onItemClick={handleNavItemClick}
      />

      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 fixed top-0 left-0 h-screen p-6 theme-bg flex flex-col hidden lg:block">
          <div className="theme-bg-secondary rounded-xl shadow-sm border theme-border-color p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
            {tables.map(table => (
              <div key={table.tableId}>
                <button
                  onClick={() => {
                    const item: NavItem = { id: table.tableId, label: table.tableName }
                    handleNavItemClick(item)
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left flex items-center gap-2
                    ${activeTableId === table.tableId
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'theme-text-secondary theme-hover-bg'}`}
                >
                  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {table.tableName}
                  {/* 展开/折叠指示器 */}
                  <svg className={`w-4 h-4 ml-auto transition-transform ${expandedTableIds.includes(table.tableId) ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedTableIds.includes(table.tableId) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categoryOrder.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          const item: NavItem = { id: `${table.tableId}:${category}`, label: category }
                          handleNavItemClick(item)
                        }}
                        className={`w-full px-4 py-2 rounded-lg text-xs font-medium text-left
                          ${activeCategory === category
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'theme-text-secondary theme-hover-bg'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {tableLoading && (
              <div className="flex items-center justify-center py-3">
                <Loading />
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 p-4 sm:p-6 lg:ml-60 min-w-0 overflow-hidden">
          <div className="rounded-xl shadow-lg p-4 sm:p-6 mb-6 relative
            bg-gradient-to-r from-blue-500 to-indigo-600
            dark:from-zinc-900 dark:to-black"
          >
            <IconBackground />
            
            <div className="absolute top-4 left-4 z-20 lg:hidden">
              <DrawerToggle onClick={handleDrawerOpen} />
            </div>

            <div className="absolute top-4 right-4 z-20">
              <ThemeSwitch />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 relative z-10">
              {siteName}
            </h1>

            <div className="max-w-2xl mx-auto relative z-10">
              <div className="relative group">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索资源标题、描述或链接..."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 pl-11 sm:pl-14 pr-10 sm:pr-12 rounded-full
                    bg-white/90 backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-white/20
                    text-base sm:text-lg text-slate-800 placeholder-slate-400
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
                  className="absolute left-4 sm:left-5 top-3.5 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-slate-400"
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
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-slate-100 text-slate-500 text-xs sm:text-sm font-medium">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-6">
              <h2 className="text-lg sm:text-xl font-bold theme-text-primary">
                {activeCategory}
              </h2>

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
                <button
                  onClick={() => setActiveTag('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                    transition-colors duration-200
                    ${!activeTag
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'theme-text-secondary theme-hover-bg'}`}
                >
                  全部
                </button>
                {getAllTags(activeCategory).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                      transition-colors duration-200
                      ${activeTag === tag
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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
                <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
                        <div className="flex-1 min-w-0 pr-4 sm:pr-7">
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
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4
                            text-slate-400 opacity-0 group-hover:opacity-100 
                            -translate-x-2 group-hover:translate-x-0
                            transition-all duration-300
                            hidden sm:block"
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

    </div>
    </>
  )
}

export default function Home() {
  return (
    <ClickStatsProvider>
      <HomeContent />
    </ClickStatsProvider>
  )
}
