import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Users,
  Lightbulb,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/todos', icon: CheckSquare, label: 'ToDo Lijst' },
  { path: '/journal', icon: BookOpen, label: 'Work Journal' },
  { path: '/meetings', icon: Users, label: 'Meeting Notes' },
  { path: '/knowledge', icon: Lightbulb, label: 'Knowledge Base' },
  { path: '/settings', icon: Settings, label: 'Configuratie' },
]

export function Layout({ children }) {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(270)
  const [isResizing, setIsResizing] = useState(false)

  // Load sidebar width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('work-suite-sidebar-width')
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10))
    }
  }, [])

  // Handle sidebar resize
  const handleMouseDown = (e) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      const newWidth = Math.min(Math.max(200, e.clientX), 400)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        localStorage.setItem('work-suite-sidebar-width', sidebarWidth.toString())
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, sidebarWidth])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={`flex h-screen bg-kingfisher-50 dark:bg-kingfisher-950 ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-kingfisher-800 shadow-lg"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          flex flex-col
          bg-white dark:bg-kingfisher-900
          border-r border-kingfisher-100 dark:border-kingfisher-800
          shadow-sm
          transition-transform duration-300 lg:transition-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!sidebarOpen ? 'lg:w-20' : ''}
        `}
        style={{ width: sidebarOpen ? sidebarWidth : undefined }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-kingfisher-100 dark:border-kingfisher-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kingfisher-500 to-teal-500 flex items-center justify-center">
            <CheckSquare className="text-white" size={24} />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-kingfisher-800 dark:text-white">
              Work Suite
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                  ? 'bg-kingfisher-500 text-white shadow-lg shadow-kingfisher-500/30'
                  : 'text-kingfisher-600 dark:text-kingfisher-300 hover:bg-kingfisher-100 dark:hover:bg-kingfisher-800'
                }
              `}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="px-3 py-4 border-t border-kingfisher-100 dark:border-kingfisher-800 space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-kingfisher-600 dark:text-kingfisher-300
              hover:bg-kingfisher-100 dark:hover:bg-kingfisher-800
              transition-all duration-200
            "
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && (
              <span className="font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-all duration-200
            "
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Uitloggen</span>}
          </button>

          {/* Collapse button (desktop only) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="
              hidden lg:flex w-full items-center gap-3 px-4 py-3 rounded-xl
              text-kingfisher-600 dark:text-kingfisher-300
              hover:bg-kingfisher-100 dark:hover:bg-kingfisher-800
              transition-all duration-200
            "
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            {sidebarOpen && <span className="font-medium">Inklappen</span>}
          </button>
        </div>
      </aside>

      {/* Resize handle */}
      {sidebarOpen && (
        <div
          className="hidden lg:block w-1 cursor-col-resize hover:bg-teal-500/50 transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
