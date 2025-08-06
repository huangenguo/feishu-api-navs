import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@/types'
import Loading from '@/components/Loading'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { IconBackground } from '@/components/IconBackground'

// 添加渐变色数组
const gradientColors = [
  'from-pink-400 to-purple-400',
  'from-blue-400 to-cyan-400',
  'from-green-400 to-emerald-400',
  'from-yellow-400 to-orange-400',
  'from-purple-400 to-indigo-400',
  'from-red-400 to-pink-400',
]

export default function Home() {
  const [links, setLinks] = useState<Link[]>([])
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadStartTime, setLoadStartTime] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeTag, setActiveTag] = useState<string>('')

  useEffect(() => {
    const fetchLinks = async () => {
      setLoadStartTime(Date.now())
      try {
        const res = await axios.get('/api/links')
        console.log('API Response Debug:', res.data.debug)
        setLinks(res.data.links)
        setCategoryOrder(res.data.categoryOrder)
      } catch (err) {
        setError('Failed to fetch links')
        console.error(err)
      } finally {
        // 确保加载动画至少显示 500ms，避免太快的闪烁
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

  // 添加获取随机渐变的函数
  const getRandomGradient = (text: string) => {
    const index = text.charCodeAt(0) % gradientColors.length
    return gradientColors[index]
  }

  // 获取所有标签
  const getAllTags = (category: string) => {
    return Array.from(new Set(
      links
        .filter(link => !category || link.category.includes(category))
        .flatMap(link => link.tags)
    )).filter(Boolean)
  }

  if (loading) return <Loading />
  if (error) return <div>Error: {error}</div>

  // 修改过滤逻辑
  const filteredLinks = links
    .filter(link => {
      const matchesSearch = 
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !activeCategory || link.category.includes(activeCategory)
      const matchesTag = !activeTag || link.tags.includes(activeTag)
      return matchesSearch && matchesCategory && matchesTag
    })
    .sort((a, b) => a.order - b.order) // 先对过滤后的链接进行排序

  // 修改分组逻辑
  const groupedLinks = filteredLinks.reduce((groups, link) => {
    // 如果是"全部"分类，按照categoryOrder分组
    if (!activeCategory) {
      link.category.forEach(category => {
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(link)
      })
    } else {
      // 如果是特定分类，使用现有的排序逻辑
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

  // 只在特定分类下进行Order排序
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

  // 修改 orderedCategories 的定义，确保只包含有内容的分类
  const orderedCategories = activeCategory 
    ? [activeCategory]
    : categoryOrder.filter(cat => groupedLinks[cat] && groupedLinks[cat].length > 0)

  return (
    <div className="min-h-screen theme-bg">
      <div className="flex min-h-screen">
        {/* 左侧边栏 */}
        <div className="w-60 shrink-0 fixed top-0 left-0 h-screen p-6 theme-bg flex flex-col">
          <div className="theme-bg-secondary rounded-xl shadow-sm border theme-border-color p-3 flex flex-col gap-1 flex-1">
            <button
              onClick={() => {
                setActiveCategory('')
                setActiveTag('')
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left
                ${!activeCategory 
                  ? 'bg-blue-50 text-blue-600' 
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
                    ? 'bg-blue-50 text-blue-600'
                    : 'theme-text-secondary theme-hover-bg'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 p-6 ml-60">
          {/* 搜索区域 */}
          <div className="rounded-xl shadow-lg p-8 mb-6 relative overflow-hidden
            bg-gradient-to-r from-blue-500 to-indigo-600
            dark:from-zinc-900 dark:to-black"
          >
            {/* 添加图标背景 */}
            <IconBackground />
            
            {/* 主题切换按钮 */}
            <div className="absolute top-4 right-4 z-20">
              <div className="flex items-center gap-4">
                <div className="p-1">  {/* 添加内边距增加点击区域 */}
                  <ThemeSwitch />
                </div>
                <div className="p-1">  {/* 添加内边距增加点击区域 */}
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

            <h1 className="text-2xl font-bold text-white text-center mb-6 relative z-10">
              飞书导航站
            </h1>
            
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="搜索导航..."
                  className="w-full px-6 py-4 pl-14 rounded-full 
                    bg-white/90 backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-white/20
                    text-lg text-slate-800 placeholder-slate-400
                    shadow-lg shadow-black/5"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              </div>
            </div>
          </div>

          {/* 分类标题和标签 */}
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

          {/* 内容区域 */}
          <div className="mt-6 space-y-8">
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
                    >
                      {link.recommend && (
                        <span className="absolute top-3 right-3 flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium
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
                          <h3 className="font-medium theme-text-primary
                            truncate text-[15px] mb-2 leading-relaxed"
                          >
                            {link.title}
                          </h3>
                          <p className="text-[13px] theme-text-description truncate leading-relaxed">
                            {link.description}
                          </p>
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
    </div>
  )
} 