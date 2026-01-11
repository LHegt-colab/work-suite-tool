import { useState } from 'react'
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
  X
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/todos', icon: CheckSquare, label: 'ToDo' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/meetings', icon: Users, label: 'Meetings' },
  { path: '/knowledge', icon: Lightbulb, label: 'Kennisbase' },
  { path: '/settings', icon: Settings, label: 'Instellingen' },
]

export function Layout({ children }) {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Navigation */}
      <nav className={`shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-primary'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-accent' : 'bg-white/20'}`}>
                  <CheckSquare className="text-white" size={18} />
                </div>
                <h1 className="text-lg font-bold text-white">Work Suite</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `${theme === 'dark' ? 'bg-accent text-white' : 'bg-white/20 text-white'}`
                        : `text-white/80 hover:text-white ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-white/10'}`
                    }`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}

              {/* Divider */}
              <div className="w-px h-6 bg-white/20 mx-2" />

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white transition-all duration-200 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-white/10'}`}
                title={theme === 'dark' ? 'Schakel naar Light Mode' : 'Schakel naar Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white transition-all duration-200 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-white/10'}`}
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-white hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-primary-dark border-white/10'}`}>
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}

              <div className="border-t border-white/10 my-2 pt-2">
                {/* Mobile theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* Mobile logout */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
