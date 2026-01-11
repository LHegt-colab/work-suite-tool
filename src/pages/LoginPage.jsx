import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { CheckSquare, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp, resetPassword } = useAuth()

  const [mode, setMode] = useState('login') // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Wachtwoorden komen niet overeen')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Wachtwoord moet minimaal 6 tekens zijn')
          setLoading(false)
          return
        }

        const result = await signUp(email, password)
        if (result.success) {
          setSuccess('Account aangemaakt! Controleer je e-mail om je account te bevestigen.')
          setMode('login')
        } else {
          setError(result.error)
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email)
        if (result.success) {
          setSuccess('Reset link verzonden! Controleer je e-mail.')
        } else {
          setError(result.error)
        }
      } else {
        const result = await signIn(email, password)
        if (result.success) {
          navigate('/')
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError('Er is een fout opgetreden')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center mb-4 shadow-lg">
              <CheckSquare className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              Work Suite Tool
            </h1>
            <p className="text-gray-500 mt-1">
              {mode === 'login' && 'Welkom terug!'}
              {mode === 'register' && 'Maak een account aan'}
              {mode === 'forgot' && 'Wachtwoord vergeten?'}
            </p>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="email"
                placeholder="E-mailadres"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Wachtwoord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Bevestig wachtwoord"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Bezig...' : (
                mode === 'login' ? 'Inloggen' :
                mode === 'register' ? 'Registreren' :
                'Reset link versturen'
              )}
            </Button>
          </form>

          {/* Mode switches */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Wachtwoord vergeten?
                </button>
                <p className="text-gray-500">
                  Nog geen account?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                    className="text-accent hover:text-accent-dark font-medium"
                  >
                    Registreren
                  </button>
                </p>
              </>
            )}
            {mode === 'register' && (
              <p className="text-gray-500">
                Al een account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="text-accent hover:text-accent-dark font-medium"
                >
                  Inloggen
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="text-accent hover:text-accent-dark font-medium"
              >
                Terug naar inloggen
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
