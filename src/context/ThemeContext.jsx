import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState('light')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load theme from localStorage first (for immediate display)
    const savedTheme = localStorage.getItem('work-suite-theme')
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Load theme from database when user is available
    if (user) {
      loadThemeFromDB()
    }
  }, [user])

  const loadThemeFromDB = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('theme')
      .eq('user_id', user.id)
      .single()

    if (data?.theme) {
      setTheme(data.theme)
      applyTheme(data.theme)
      localStorage.setItem('work-suite-theme', data.theme)
    }
  }

  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('work-suite-theme', newTheme)

    // Save to database if user is logged in
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme: newTheme,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme moet binnen ThemeProvider gebruikt worden')
  }
  return context
}
