import { useState, useEffect, useCallback, useRef } from 'react'

export interface NavItem {
  id: string
  label: string
  children?: NavItem[]
  href?: string
}

export interface DrawerSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpen?: () => void
  placement?: 'left' | 'right'
  width?: string
  navItems: NavItem[]
  activeItemId?: string
  expandedItemIds?: string[]  // 外部控制的展开项ID列表
  onItemClick?: (item: NavItem) => void
  onExpandedChange?: (expandedIds: string[]) => void  // 展开状态变化回调
  breakpoint?: string
  overlayClassName?: string
  sidebarClassName?: string
}

export default function DrawerSidebar({
  isOpen,
  onClose,
  onOpen,
  placement = 'left',
  width = 'w-80',
  navItems,
  activeItemId,
  expandedItemIds = [],
  onItemClick,
  onExpandedChange,
  breakpoint = 'lg',
  overlayClassName = '',
  sidebarClassName = '',
}: DrawerSidebarProps) {
  const [internalExpandedItems, setInternalExpandedItems] = useState<Set<string>>(new Set())
  
  // 使用外部展开状态，如果没有则使用内部状态
  const expandedItems = expandedItemIds.length > 0 
    ? new Set(expandedItemIds) 
    : internalExpandedItems
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const isDragging = useRef(false)

  const toggleExpand = useCallback((itemId: string) => {
    const updateState = (prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    }

    // 更新内部状态
    if (expandedItemIds.length === 0) {
      setInternalExpandedItems(updateState)
    }
    
    // 更新外部状态
    if (onExpandedChange) {
      // 外部受控模式：直接从最新的 expandedItemIds 创建集合，避免闭包陈旧值问题
      // 内部状态模式：使用 expandedItems（内部状态通过 setInternalExpandedItems 更新）
      const currentSet = expandedItemIds.length > 0 ? new Set(expandedItemIds) : expandedItems
      const newSet = updateState(currentSet)
      onExpandedChange(Array.from(newSet))
    }
  }, [expandedItemIds, expandedItems, onExpandedChange])

  const handleItemClick = useCallback((item: NavItem) => {
    // 展开逻辑由外部 handleNavItemClick 控制，不再调用 toggleExpand
    onItemClick?.(item)
    // 只有叶子节点（分类项）才关闭抽屉
    if (!item.children) {
      onClose()
    }
  }, [onItemClick, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
      onOpen?.()
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen, onOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      if (touchStartX.current < 50) {
        isDragging.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
      if (!isDragging.current) return
      const diff = touchEndX.current - touchStartX.current
      if (diff > 50 && !isOpen) {
        onOpen?.()
      } else if (diff < -50 && isOpen) {
        onClose()
      }
      isDragging.current = false
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, onOpen, onClose])

  const renderNavItems = (items: NavItem[], depth = 0) => {
    return items.map(item => (
      <li key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200
            ${activeItemId === item.id
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'theme-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
          aria-expanded={item.children ? expandedItems.has(item.id) : undefined}
          aria-haspopup={item.children ? 'true' : undefined}
          role={item.children ? 'button' : undefined}
        >
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {item.children && (
            <svg
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${expandedItems.has(item.id) ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {item.children && expandedItems.has(item.id) && (
          <ul className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {renderNavItems(item.children, depth + 1)}
          </ul>
        )}
      </li>
    ))
  }

  const breakpointClasses = {
    sm: 'block sm:hidden',
    md: 'block md:hidden',
    lg: 'block lg:hidden',
    xl: 'block xl:hidden',
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${breakpointClasses[breakpoint as keyof typeof breakpointClasses]}`}
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="关闭侧边栏"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose()
          }
        }}
      />

      {/* 抽屉侧边栏 */}
      <aside
        className={`fixed top-0 h-full ${width} z-50
          theme-bg-secondary border-r theme-border-color
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : `${placement === 'left' ? '-translate-x-full' : 'translate-x-full'}`}
          ${breakpointClasses[breakpoint as keyof typeof breakpointClasses]}
          ${sidebarClassName}`}
        style={{ [placement]: 0 }}
        role="navigation"
        aria-label="侧边栏导航"
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b theme-border-color">
            <h2 className="text-lg font-semibold theme-text-primary">数据表</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="关闭侧边栏"
            >
              <svg className="w-5 h-5 theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 导航内容 */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {renderNavItems(navItems)}
            </ul>
          </nav>

          {/* 底部提示 */}
          <div className="p-4 border-t theme-border-color">
            <p className="text-xs theme-text-description text-center">
              按 ESC 键关闭侧边栏
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export function DrawerToggle({ onClick, className = '', 'aria-label': ariaLabel = '打开侧边栏' }: {
  onClick: () => void
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg theme-hover-bg transition-colors lg:hidden ${className}`}
      aria-label={ariaLabel}
      aria-expanded={false}
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
