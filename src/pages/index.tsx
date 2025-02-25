import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@/types'
import Loading from '@/components/Loading'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeTag, setActiveTag] = useState<string>('')

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await axios.get('/api/links')
        setLinks(res.data.links)
        setCategoryOrder(res.data.categoryOrder)
      } catch (err) {
        setError('Failed to fetch links')
        console.error(err)
      } finally {
        setLoading(false)
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
        .filter(link => !category || link.category === category)
        .flatMap(link => link.tags)
    )).filter(Boolean)
  }

  if (loading) return <Loading />
  if (error) return <div>Error: {error}</div>

  // 修改过滤逻辑
  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !activeCategory || link.category === activeCategory
    const matchesTag = !activeTag || link.tags.includes(activeTag)
    return matchesSearch && matchesCategory && matchesTag
  })

  // 按分类分组
  const groupedLinks = filteredLinks.reduce((groups, link) => {
    const category = link.category || '其他'
    return {
      ...groups,
      [category]: [...(groups[category] || []), link]
    }
  }, {} as Record<string, Link[]>)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* 左侧边栏 */}
        <div className="w-60 shrink-0 p-6 bg-slate-50 min-h-screen flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col gap-1 flex-1">
            <button
              onClick={() => {
                setActiveCategory('')
                setActiveTag('')
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left
                ${!activeCategory 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50'}`}
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
                    : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 p-6">
          {/* 搜索区域 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-2xl font-bold text-white text-center mb-6">
              一个小小的导航网站
            </h1>
            <div className="max-w-2xl mx-auto">
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
          <div className="flex items-center gap-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {activeCategory || '全部'}
            </h2>
            
            {activeCategory && (
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTag('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium
                    transition-colors duration-200
                    ${!activeTag
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'}`}
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
                        : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 内容卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 bg-white rounded-xl border border-slate-200
                  hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5
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
                    bg-slate-50 group-hover:bg-blue-50
                    transition-all duration-300"
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
                    <h3 className="font-medium text-slate-800 group-hover:text-blue-600
                      truncate text-sm mb-1.5 leading-relaxed"
                    >
                      {link.title}
                    </h3>
                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-600 leading-relaxed">
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
      </div>
    </div>
  )
} 