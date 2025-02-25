import { useEffect, useState } from 'react'
import { HashLoader } from 'react-spinners'

export default function Loading() {
  const [showLoader, setShowLoader] = useState(false)
  
  // 添加一个小延迟，避免闪烁
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true)
    }, 200) // 200ms 延迟，避免加载太快时的闪烁

    return () => clearTimeout(timer)
  }, [])

  if (!showLoader) return null

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
      <HashLoader
        color="#3B82F6"
        size={50}
        speedMultiplier={0.8}
      />
      <span className="mt-4 text-gray-600 font-medium tracking-wide animate-pulse">
        加载中...
      </span>
    </div>
  )
} 