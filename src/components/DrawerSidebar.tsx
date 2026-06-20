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
  onItemClick?: (item: NavItem) => void
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
  onItemClick,
  breakpoint = 'lg',
  overlayClassName = '',
  sidebarClassName = '',
}: DrawerSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const isDragging = useRef(false)

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const handleItemClick = useCallback((item: NavItem) => {
    if (item.children) {
      toggleExpand(item.id)
    }
    onItemClick?.(item)
    if (!item.children) {
      onClose()
    }
  }, [toggleExpand, onItemClick, onClose])

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
              ? 'bg-blue-50 text-blue-600'
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
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300
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
          <div className="flex items-center justify-between p-4 border-b theme-border-color">
            <h2 className="text-lg font-semibold theme-text-primary">导航菜单</h2>
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

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {renderNavItems(navItems)}
            </ul>
          </nav>

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
      className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden ${className}`}
      aria-label={ariaLabel}
      aria-expanded={false}
    >
      <svg className="w-6 h-6 theme-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
