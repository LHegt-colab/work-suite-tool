import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/ui/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
  BookOpen,
  Users,
  Lightbulb
} from 'lucide-react'
import { format, isToday, isPast, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { nl } from 'date-fns/locale'

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    openTodos: 0,
    overdueTodos: 0,
    todayDue: 0,
    todayStart: 0,
    completedWeek: 0,
    completedMonth: 0,
  })
  const [todayTodos, setTodayTodos] = useState([])
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [latestJournal, setLatestJournal] = useState(null)
  const [activityLog, setActivityLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const weekStart = format(startOfWeek(new Date(), { locale: nl }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(new Date(), { locale: nl }), 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

    // Fetch all todos
    const { data: todos } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .is('parent_id', null)

    if (todos) {
      const openTodos = todos.filter(t => !['afgerond', 'geannuleerd'].includes(t.status))
      const overdueTodos = openTodos.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)))
      const todayDue = openTodos.filter(t => t.due_date === today)
      const todayStart = openTodos.filter(t => t.start_date === today)
      const completedWeek = todos.filter(t =>
        t.status === 'afgerond' &&
        t.updated_at >= weekStart &&
        t.updated_at <= weekEnd
      )
      const completedMonth = todos.filter(t =>
        t.status === 'afgerond' &&
        t.updated_at >= monthStart &&
        t.updated_at <= monthEnd
      )

      setStats({
        openTodos: openTodos.length,
        overdueTodos: overdueTodos.length,
        todayDue: todayDue.length,
        todayStart: todayStart.length,
        completedWeek: completedWeek.length,
        completedMonth: completedMonth.length,
      })

      // Today & overdue todos for widget
      const urgentTodos = [...overdueTodos, ...todayDue, ...todayStart]
        .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
        .slice(0, 5)
      setTodayTodos(urgentTodos)
    }

    // Fetch upcoming meetings
    const { data: meetings } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(5)

    setUpcomingMeetings(meetings || [])

    // Fetch latest journal
    const { data: journals } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(1)

    setLatestJournal(journals?.[0] || null)

    // Fetch activity log
    const { data: activities } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setActivityLog(activities || [])

    setLoading(false)
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - new Date(date)
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Zojuist'
    if (diffMins < 60) return `${diffMins} min geleden`
    if (diffHours < 24) return `${diffHours} uur geleden`
    if (diffDays < 7) return `${diffDays} dagen geleden`
    return format(new Date(date), 'dd MMM', { locale: nl })
  }

  const actionLabels = {
    create: 'Aangemaakt',
    update: 'Bijgewerkt',
    delete: 'Verwijderd',
    archive: 'Gearchiveerd'
  }

  const entityLabels = {
    todo: 'ToDo',
    journal: 'Journal',
    meeting: 'Meeting',
    knowledge: 'Knowledge'
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Laden...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Dashboard</h2>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Openstaand"
            value={stats.openTodos}
            icon={CheckSquare}
            color="text-primary"
          />
          <StatCard
            label="Verlopen"
            value={stats.overdueTodos}
            icon={AlertTriangle}
            color="text-red-600"
          />
          <StatCard
            label="Vandaag (Due)"
            value={stats.todayDue}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            label="Vandaag (Start)"
            value={stats.todayStart}
            icon={Calendar}
            color="text-accent"
          />
          <StatCard
            label="Deze Week"
            value={stats.completedWeek}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatCard
            label="Deze Maand"
            value={stats.completedMonth}
            icon={TrendingUp}
            color="text-blue-600"
          />
        </div>

        {/* Widgets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Today & Overdue Todos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={20} className="text-accent" />
                Vandaag & Verlopen ToDo's
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayTodos.length === 0 ? (
                <p className="text-gray-500 text-sm">Geen urgente ToDo's</p>
              ) : (
                <div className="space-y-3">
                  {todayTodos.map(todo => (
                    <Link
                      key={todo.id}
                      to="/todos"
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-gray-800 text-sm">
                          {todo.title}
                        </span>
                        <Badge variant={todo.priority}>{todo.priority}</Badge>
                      </div>
                      {todo.due_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {format(new Date(todo.due_date), 'dd MMM yyyy', { locale: nl })}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-accent" />
                Aankomende Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <p className="text-gray-500 text-sm">Geen geplande meetings</p>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map(meeting => (
                    <Link
                      key={meeting.id}
                      to="/meetings"
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-800 text-sm">
                        {meeting.subject}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(meeting.date), 'dd MMM yyyy', { locale: nl })} om {meeting.time}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Journal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen size={20} className="text-accent" />
                Laatste Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestJournal ? (
                <p className="text-gray-500 text-sm">Geen journal entries</p>
              ) : (
                <Link
                  to="/journal"
                  className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800 text-sm">
                      {format(new Date(latestJournal.date), 'dd MMM yyyy', { locale: nl })} {latestJournal.time}
                    </span>
                    {latestJournal.category && (
                      <Badge variant="default">{latestJournal.category}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {latestJournal.description}
                  </p>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={20} className="text-primary" />
              Recente Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-gray-500 text-sm">Nog geen activiteit geregistreerd</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activityLog.map(activity => (
                  <div
                    key={activity.id}
                    className={`
                      p-3 rounded-lg border-l-4 bg-gray-50
                      ${activity.action === 'create' ? 'border-l-green-500' : ''}
                      ${activity.action === 'update' ? 'border-l-blue-500' : ''}
                      ${activity.action === 'delete' ? 'border-l-red-500' : ''}
                      ${activity.action === 'archive' ? 'border-l-gray-500' : ''}
                    `}
                  >
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(activity.created_at)}
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {actionLabels[activity.action]}: {entityLabels[activity.entity_type]} - {activity.entity_title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <Icon className={`mb-2 ${color}`} size={24} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}
