import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'

export default function ResponsiveLayout({ sidebar: SidebarComponent, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change (listen to popstate) and on resize to desktop
  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false)
    }
    window.addEventListener('resize', closeOnResize)
    return () => window.removeEventListener('resize', closeOnResize)
  }, [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <div className="gradient-bg flex min-h-screen">
      {/* Desktop sidebar — always visible at lg+ */}
      <div className="hidden lg:flex">
        <SidebarComponent />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Slide-in sidebar drawer */}
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] animate-slide-in flex-col">
            {/* Close button */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            <SidebarComponent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Top bar — with hamburger on mobile */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#0a0a0f]/80 px-4 py-3 backdrop-blur-xl lg:justify-end lg:px-8 lg:py-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <NotificationBell />
        </div>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
