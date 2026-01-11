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
  { path: '/settings', icon: Settings, label: 'Configuratie' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Work Suite</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-accent text-white'
                        : 'border-transparent text-gray-300 hover:border-accent-light hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="inline-flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">Uitloggen</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-light focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-primary-dark">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-gray-300 hover:bg-primary-light hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}

              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-primary-light hover:text-white"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              {/* Mobile logout */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-primary-light hover:text-white"
              >
                <LogOut size={20} />
                Uitloggen
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
