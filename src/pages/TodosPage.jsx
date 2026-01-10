import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/ui/Layout'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Archive,
  LayoutGrid,
  List,
  GripVertical
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'

const PRIORITIES = ['zeer-laag', 'laag', 'normaal', 'hoog', 'kritiek']
const STATUSES = ['nieuw', 'gepland', 'in-progress', 'on-hold', 'afgerond', 'geannuleerd']
const RECURRING_TYPES = ['dagelijks', 'wekelijks', 'maandelijks']

export function TodosPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [viewMode, setViewMode] = useState('detailed')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [todayMode, setTodayMode] = useState('both')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [parentTodoId, setParentTodoId] = useState(null)
  const [commentTodoId, setCommentTodoId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner: '',
    start_date: '',
    due_date: '',
    priority: 'normaal',
    status: 'nieuw',
    is_recurring: false,
    recurring_type: 'dagelijks',
    recurring_interval: 1,
  })
  const [commentText, setCommentText] = useState('')

  // Bulk selection
  const [selectedTodos, setSelectedTodos] = useState([])
  const [expandedTodos, setExpandedTodos] = useState({})

  useEffect(() => {
    if (user) {
      loadTodos()
    }
  }, [user])

  const loadTodos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        subtasks:todos(*)
      `)
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading todos:', error)
    } else {
      // Load comments for each todo
      const todosWithComments = await Promise.all(
        (data || []).map(async (todo) => {
          const { data: comments } = await supabase
            .from('todo_comments')
            .select('*')
            .eq('todo_id', todo.id)
            .order('created_at', { ascending: true })
          return { ...todo, comments: comments || [] }
        })
      )
      setTodos(todosWithComments)
    }
    setLoading(false)
  }

  const logActivity = async (action, title) => {
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action,
      entity_type: 'todo',
      entity_title: title
    })
  }

  const openModal = (todo = null, parentId = null) => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || '',
        owner: todo.owner || '',
        start_date: todo.start_date || '',
        due_date: todo.due_date || '',
        priority: todo.priority,
        status: todo.status,
        is_recurring: todo.is_recurring,
        recurring_type: todo.recurring_type || 'dagelijks',
        recurring_interval: todo.recurring_interval || 1,
      })
      setEditingTodo(todo)
    } else {
      setFormData({
        title: '',
        description: '',
        owner: '',
        start_date: '',
        due_date: '',
        priority: 'normaal',
        status: 'nieuw',
        is_recurring: false,
        recurring_type: 'dagelijks',
        recurring_interval: 1,
      })
      setEditingTodo(null)
    }
    setParentTodoId(parentId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTodo(null)
    setParentTodoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const todoData = {
      user_id: user.id,
      parent_id: parentTodoId,
      title: formData.title,
      description: formData.description || null,
      owner: formData.owner || null,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
      priority: formData.priority,
      status: formData.status,
      is_recurring: formData.is_recurring,
      recurring_type: formData.is_recurring ? formData.recurring_type : null,
      recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
    }

    if (editingTodo) {
      const { error } = await supabase
        .from('todos')
        .update(todoData)
        .eq('id', editingTodo.id)

      if (!error) {
        // Check if completing a recurring todo
        if (todoData.status === 'afgerond' && todoData.is_recurring && editingTodo.status !== 'afgerond') {
          await createRecurringInstance(editingTodo)
        }
        await logActivity('update', formData.title)
      }
    } else {
      const { error } = await supabase
        .from('todos')
        .insert(todoData)

      if (!error) {
        await logActivity('create', formData.title)
      }
    }

    closeModal()
    loadTodos()
  }

  const createRecurringInstance = async (originalTodo) => {
    const baseDate = originalTodo.due_date || originalTodo.start_date || new Date().toISOString().split('T')[0]
    let nextDate = new Date(baseDate)
    const interval = originalTodo.recurring_interval || 1

    switch (originalTodo.recurring_type) {
      case 'dagelijks':
        nextDate.setDate(nextDate.getDate() + interval)
        break
      case 'wekelijks':
        nextDate.setDate(nextDate.getDate() + (7 * interval))
        break
      case 'maandelijks':
        nextDate.setMonth(nextDate.getMonth() + interval)
        break
    }

    const nextDateStr = nextDate.toISOString().split('T')[0]

    await supabase.from('todos').insert({
      user_id: user.id,
      title: originalTodo.title,
      description: originalTodo.description,
      owner: originalTodo.owner,
      start_date: nextDateStr,
      due_date: nextDateStr,
      priority: originalTodo.priority,
      status: 'nieuw',
      is_recurring: true,
      recurring_type: originalTodo.recurring_type,
      recurring_interval: originalTodo.recurring_interval,
    })
  }

  const deleteTodo = async (id, title) => {
    if (!confirm('Weet je zeker dat je deze ToDo wilt verwijderen?')) return

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (!error) {
      await logActivity('delete', title)
      loadTodos()
    }
  }

  const archiveTodo = async (id, title) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_archived: true })
      .eq('id', id)

    if (!error) {
      await logActivity('archive', title)
      loadTodos()
    }
  }

  const openCommentModal = (todoId) => {
    setCommentTodoId(todoId)
    setCommentText('')
    setIsCommentModalOpen(true)
  }

  const saveComment = async (e) => {
    e.preventDefault()

    await supabase.from('todo_comments').insert({
      todo_id: commentTodoId,
      user_id: user.id,
      text: commentText
    })

    setIsCommentModalOpen(false)
    loadTodos()
  }

  const toggleExpand = (todoId) => {
    setExpandedTodos(prev => ({
      ...prev,
      [todoId]: !prev[todoId]
    }))
  }

  const toggleSelect = (todoId) => {
    setSelectedTodos(prev =>
      prev.includes(todoId)
        ? prev.filter(id => id !== todoId)
        : [...prev, todoId]
    )
  }

  const bulkUpdateStatus = async (newStatus) => {
    for (const todoId of selectedTodos) {
      await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todoId)
    }
    setSelectedTodos([])
    loadTodos()
  }

  const bulkDelete = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedTodos.length} ToDo's wilt verwijderen?`)) return

    for (const todoId of selectedTodos) {
      await supabase.from('todos').delete().eq('id', todoId)
    }
    setSelectedTodos([])
    loadTodos()
  }

  // Filter and sort todos
  const getFilteredTodos = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]

    let filtered = [...todos]

    // Tab filter
    if (activeTab === 'today') {
      filtered = filtered.filter(t => {
        if (['afgerond', 'geannuleerd'].includes(t.status)) return false
        if (todayMode === 'due') return t.due_date === today
        if (todayMode === 'start') return t.start_date === today
        return t.due_date === today || t.start_date === today
      })
    } else if (activeTab === 'all') {
      filtered = filtered.filter(t => !['afgerond', 'geannuleerd'].includes(t.status))
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(t => ['afgerond', 'geannuleerd'].includes(t.status))
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.owner?.toLowerCase().includes(query)
      )
    }

    // Priority filter
    if (filterPriority) {
      filtered = filtered.filter(t => t.priority === filterPriority)
    }

    // Owner filter
    if (filterOwner) {
      filtered = filtered.filter(t => t.owner === filterOwner)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority)
        case 'status':
          return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)
        case 'dueDate':
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date) - new Date(b.due_date)
        case 'startDate':
          if (!a.start_date) return 1
          if (!b.start_date) return -1
          return new Date(a.start_date) - new Date(b.start_date)
        case 'owner':
          return (a.owner || '').localeCompare(b.owner || '')
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

    return filtered
  }, [todos, activeTab, todayMode, searchQuery, filterPriority, filterOwner, sortBy])

  const filteredTodos = getFilteredTodos()
  const owners = [...new Set(todos.map(t => t.owner).filter(Boolean))]

  const isOverdue = (todo) => {
    return todo.due_date && isPast(new Date(todo.due_date)) && !isToday(new Date(todo.due_date)) && !['afgerond', 'geannuleerd'].includes(todo.status)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-kingfisher-500 dark:text-kingfisher-400">Laden...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-kingfisher-800 dark:text-white">ToDo Lijst</h1>
          <Button onClick={() => openModal()}>
            <Plus size={20} />
            Nieuwe ToDo
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'today', label: 'Vandaag' },
            { key: 'all', label: "Alle ToDo's" },
            { key: 'completed', label: 'Afgehandeld' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 rounded-full font-medium transition-all
                ${activeTab === tab.key
                  ? 'bg-kingfisher-500 text-white shadow-lg shadow-kingfisher-500/30'
                  : 'bg-white dark:bg-kingfisher-800 text-kingfisher-600 dark:text-kingfisher-300 hover:bg-kingfisher-100 dark:hover:bg-kingfisher-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-kingfisher-400" size={20} />
                <Input
                  placeholder="Zoeken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-auto min-w-[150px]">
                <option value="date">Datum</option>
                <option value="startDate">Startdatum</option>
                <option value="dueDate">Due datum</option>
                <option value="priority">Prioriteit</option>
                <option value="status">Status</option>
                <option value="owner">Eigenaar</option>
              </Select>

              {/* Priority filter */}
              <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-auto min-w-[130px]">
                <option value="">Alle prioriteiten</option>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>

              {/* Owner filter */}
              {owners.length > 0 && (
                <Select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className="w-auto min-w-[130px]">
                  <option value="">Alle eigenaren</option>
                  {owners.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              )}

              {/* Today mode filter */}
              {activeTab === 'today' && (
                <Select value={todayMode} onChange={(e) => setTodayMode(e.target.value)} className="w-auto min-w-[180px]">
                  <option value="both">Due + Start</option>
                  <option value="due">Due date</option>
                  <option value="start">Startdatum</option>
                </Select>
              )}

              {/* View toggle */}
              <div className="flex bg-kingfisher-100 dark:bg-kingfisher-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'detailed' ? 'bg-white dark:bg-kingfisher-700 shadow' : ''}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'compact' ? 'bg-white dark:bg-kingfisher-700 shadow' : ''}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk actions */}
        {selectedTodos.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-kingfisher-500 text-white rounded-xl">
            <span className="font-medium">{selectedTodos.length} geselecteerd</span>
            <Button variant="ghost" className="text-white hover:bg-kingfisher-600" onClick={() => bulkUpdateStatus('afgerond')}>
              Markeer Afgerond
            </Button>
            <Button variant="ghost" className="text-white hover:bg-kingfisher-600" onClick={() => bulkUpdateStatus('in-progress')}>
              Zet op In Progress
            </Button>
            <Button variant="ghost" className="text-white hover:bg-red-600" onClick={bulkDelete}>
              Verwijder
            </Button>
            <Button variant="ghost" className="text-white hover:bg-kingfisher-600" onClick={() => setSelectedTodos([])}>
              Deselecteer
            </Button>
          </div>
        )}

        {/* Todo list */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-kingfisher-500 dark:text-kingfisher-400">
                Geen ToDo's gevonden
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                viewMode={viewMode}
                isOverdue={isOverdue(todo)}
                isExpanded={expandedTodos[todo.id]}
                isSelected={selectedTodos.includes(todo.id)}
                onToggleExpand={() => toggleExpand(todo.id)}
                onToggleSelect={() => toggleSelect(todo.id)}
                onEdit={() => openModal(todo)}
                onDelete={() => deleteTodo(todo.id, todo.title)}
                onArchive={() => archiveTodo(todo.id, todo.title)}
                onAddSubtask={() => openModal(null, todo.id)}
                onAddComment={() => openCommentModal(todo.id)}
                onEditSubtask={(subtask) => openModal(subtask, todo.id)}
                onDeleteSubtask={(subtask) => deleteTodo(subtask.id, subtask.title)}
              />
            ))
          )}
        </div>
      </div>

      {/* Todo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTodo ? 'ToDo Bewerken' : parentTodoId ? 'Subtaak Toevoegen' : 'Nieuwe ToDo'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titel *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <TextArea
            label="Omschrijving"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <Input
            label="Eigenaar"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Startdatum"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prioriteit"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          {/* Recurring options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4 text-teal-500 rounded"
              />
              <span className="text-sm font-medium text-kingfisher-700 dark:text-kingfisher-300">
                Terugkerend
              </span>
            </label>

            {formData.is_recurring && (
              <div className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl space-y-3">
                <Select
                  label="Interval"
                  value={formData.recurring_type}
                  onChange={(e) => setFormData({ ...formData, recurring_type: e.target.value })}
                >
                  {RECURRING_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>

                <Input
                  label={`Elke hoeveel ${formData.recurring_type === 'dagelijks' ? 'dagen' : formData.recurring_type === 'wekelijks' ? 'weken' : 'maanden'}`}
                  type="number"
                  min="1"
                  value={formData.recurring_interval}
                  onChange={(e) => setFormData({ ...formData, recurring_interval: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="success" className="flex-1">
              Opslaan
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Annuleren
            </Button>
          </div>
        </form>
      </Modal>

      {/* Comment Modal */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title="Opmerking Toevoegen"
      >
        <form onSubmit={saveComment} className="space-y-4">
          <TextArea
            label="Opmerking"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <Button type="submit" variant="success" className="flex-1">
              Toevoegen
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsCommentModalOpen(false)} className="flex-1">
              Annuleren
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

function TodoItem({
  todo,
  viewMode,
  isOverdue,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onDelete,
  onArchive,
  onAddSubtask,
  onAddComment,
  onEditSubtask,
  onDeleteSubtask
}) {
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0
  const hasComments = todo.comments && todo.comments.length > 0
  const isCompact = viewMode === 'compact'

  return (
    <Card className={`
      transition-all duration-200
      ${isOverdue ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10' : ''}
      ${todo.priority === 'kritiek' ? 'border-l-4 border-l-red-500' : ''}
      ${todo.priority === 'hoog' ? 'border-l-4 border-l-amber-500' : ''}
    `}>
      <CardContent className={isCompact ? 'py-3' : 'py-4'}>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 w-5 h-5 text-teal-500 rounded"
          />

          {/* Expand button */}
          {(hasSubtasks || hasComments) && !isCompact && (
            <button onClick={onToggleExpand} className="mt-1 text-kingfisher-400 hover:text-kingfisher-600">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-kingfisher-800 dark:text-kingfisher-100">
                {todo.title}
              </span>
              <Badge variant={todo.priority}>{todo.priority}</Badge>
              <Badge variant={todo.status}>{todo.status}</Badge>
              {todo.is_recurring && (
                <Badge variant="info" className="flex items-center gap-1">
                  <RefreshCw size={12} /> Terugkerend
                </Badge>
              )}
              {isOverdue && <Badge variant="danger">VERLOPEN</Badge>}
            </div>

            {!isCompact && (
              <>
                {todo.description && (
                  <p className="text-sm text-kingfisher-600 dark:text-kingfisher-400 mb-2">
                    {todo.description}
                  </p>
                )}

                <div className="text-xs text-kingfisher-500 dark:text-kingfisher-400 space-y-1">
                  {todo.owner && <div><strong>Eigenaar:</strong> {todo.owner}</div>}
                  {todo.start_date && (
                    <div><strong>Start:</strong> {format(new Date(todo.start_date), 'dd MMM yyyy', { locale: nl })}</div>
                  )}
                  {todo.due_date && (
                    <div><strong>Due:</strong> {format(new Date(todo.due_date), 'dd MMM yyyy', { locale: nl })}</div>
                  )}
                </div>

                {/* Subtasks */}
                {isExpanded && hasSubtasks && (
                  <div className="mt-4 ml-4 space-y-2">
                    <h4 className="text-sm font-semibold text-kingfisher-700 dark:text-kingfisher-300">Subtaken:</h4>
                    {todo.subtasks.map(subtask => (
                      <div key={subtask.id} className="p-3 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{subtask.title}</span>
                          <Badge variant={subtask.priority} className="text-xs">{subtask.priority}</Badge>
                          <Badge variant={subtask.status} className="text-xs">{subtask.status}</Badge>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="ghost" onClick={() => onEditSubtask(subtask)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDeleteSubtask(subtask)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments */}
                {isExpanded && hasComments && (
                  <div className="mt-4 ml-4 space-y-2">
                    <h4 className="text-sm font-semibold text-kingfisher-700 dark:text-kingfisher-300">Opmerkingen:</h4>
                    {todo.comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl">
                        <div className="text-xs text-kingfisher-500 mb-1">
                          {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className={`flex flex-wrap gap-2 ${isCompact ? 'mt-2' : 'mt-4'}`}>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Edit2 size={16} /> {!isCompact && 'Bewerk'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onAddSubtask}>
                <Plus size={16} /> {!isCompact && 'Subtaak'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onAddComment}>
                <MessageSquare size={16} /> {!isCompact && 'Opmerking'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onArchive}>
                <Archive size={16} /> {!isCompact && 'Archiveer'}
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={onDelete}>
                <Trash2 size={16} /> {!isCompact && 'Verwijder'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
