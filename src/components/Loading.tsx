import { HashLoader } from 'react-spinners'

export default function Loading() {
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