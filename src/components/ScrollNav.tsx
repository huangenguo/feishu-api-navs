import { useCallback, useEffect, useState } from 'react'

export function ScrollNav() {
  const [isNearTop, setIsNearTop] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(false)

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    const threshold = 100

    setIsNearTop(scrollTop < threshold)
    setIsNearBottom(scrollTop + clientHeight >= scrollHeight - threshold)
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-50">
      {/* 返回顶端 */}
      <button
        onClick={scrollToTop}
        className={`w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg
          flex items-center justify-center
          text-slate-600 dark:text-slate-300 hover:text-blue-600
          border border-slate-200 dark:border-slate-700
          transition-all duration-300
          hover:shadow-xl hover:scale-110
          active:scale-95
          ${isNearTop ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="返回顶端"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {/* 跳至底端 */}
      <button
        onClick={scrollToBottom}
        className={`w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg
          flex items-center justify-center
          text-slate-600 dark:text-slate-300 hover:text-blue-600
          border border-slate-200 dark:border-slate-700
          transition-all duration-300
          hover:shadow-xl hover:scale-110
          active:scale-95
          ${isNearBottom ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="跳至底端"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  )
}

