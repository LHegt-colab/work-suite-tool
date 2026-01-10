import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/ui/Layout'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge, Tag } from '../components/ui/Badge'
import { Plus, Search, Edit2, Trash2, Link as LinkIcon, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function JournalPage() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [todos, setTodos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    category: '',
    tags: '',
    description: '',
    linked_todo_id: '',
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)

    // Load journals
    const { data: journalData } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    setJournals(journalData || [])

    // Load todos for linking
    const { data: todoData } = await supabase
      .from('todos')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .is('parent_id', null)
      .order('title')

    setTodos(todoData || [])

    // Load categories
    const { data: categoryData } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', user.id)
      .eq('type', 'journal')

    setCategories(categoryData?.map(c => c.name) || [])

    setLoading(false)
  }

  const logActivity = async (action, title) => {
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action,
      entity_type: 'journal',
      entity_title: title
    })
  }

  const openModal = (journal = null) => {
    if (journal) {
      setFormData({
        date: journal.date,
        time: journal.time,
        category: journal.category || '',
        tags: journal.tags?.join(', ') || '',
        description: journal.description,
        linked_todo_id: journal.linked_todo_id || '',
      })
      setEditingJournal(journal)
    } else {
      const now = new Date()
      setFormData({
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        category: '',
        tags: '',
        description: '',
        linked_todo_id: '',
      })
      setEditingJournal(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingJournal(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t)

    const journalData = {
      user_id: user.id,
      date: formData.date,
      time: formData.time,
      category: formData.category || null,
      tags,
      description: formData.description,
      linked_todo_id: formData.linked_todo_id || null,
    }

    // Save category if new
    if (formData.category && !categories.includes(formData.category)) {
      await supabase.from('categories').insert({
        user_id: user.id,
        type: 'journal',
        name: formData.category
      })
    }

    if (editingJournal) {
      await supabase
        .from('journals')
        .update(journalData)
        .eq('id', editingJournal.id)

      await logActivity('update', `${formData.date} ${formData.time}`)
    } else {
      await supabase.from('journals').insert(journalData)
      await logActivity('create', `${formData.date} ${formData.time}`)
    }

    closeModal()
    loadData()
  }

  const deleteJournal = async (id, date, time) => {
    if (!confirm('Weet je zeker dat je dit journal item wilt verwijderen?')) return

    await supabase.from('journals').delete().eq('id', id)
    await logActivity('delete', `${date} ${time}`)
    loadData()
  }

  const archiveJournal = async (id, date, time) => {
    await supabase
      .from('journals')
      .update({ is_archived: true })
      .eq('id', id)

    await logActivity('archive', `${date} ${time}`)
    loadData()
  }

  // Filter journals
  const filteredJournals = journals.filter(journal => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!journal.description.toLowerCase().includes(query) &&
          !journal.category?.toLowerCase().includes(query) &&
          !journal.tags?.some(t => t.toLowerCase().includes(query))) {
        return false
      }
    }

    if (filterCategory && journal.category !== filterCategory) {
      return false
    }

    if (filterStartDate && journal.date < filterStartDate) {
      return false
    }

    if (filterEndDate && journal.date > filterEndDate) {
      return false
    }

    return true
  })

  // Get unique categories from journals
  const allCategories = [...new Set([
    ...categories,
    ...journals.map(j => j.category).filter(Boolean)
  ])]

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
          <h1 className="text-2xl font-bold text-kingfisher-800 dark:text-white">Work Journal</h1>
          <Button onClick={() => openModal()}>
            <Plus size={20} />
            Nieuw Journal Item
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-kingfisher-400" size={20} />
                <Input
                  placeholder="Zoeken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-auto min-w-[150px]"
              >
                <option value="">Alle categorieën</option>
                {allCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>

              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-auto"
                placeholder="Van datum"
              />

              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-auto"
                placeholder="Tot datum"
              />

              {(filterCategory || filterStartDate || filterEndDate) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterCategory('')
                    setFilterStartDate('')
                    setFilterEndDate('')
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journal list */}
        <div className="space-y-4">
          {filteredJournals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-kingfisher-500 dark:text-kingfisher-400">
                Geen journal items gevonden
              </CardContent>
            </Card>
          ) : (
            filteredJournals.map(journal => {
              const linkedTodo = todos.find(t => t.id === journal.linked_todo_id)

              return (
                <Card key={journal.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-kingfisher-800 dark:text-kingfisher-100">
                            {format(new Date(journal.date), 'dd MMMM yyyy', { locale: nl })} {journal.time}
                          </span>
                          {journal.category && (
                            <Badge variant="default">{journal.category}</Badge>
                          )}
                        </div>

                        <p className="text-kingfisher-600 dark:text-kingfisher-300 whitespace-pre-wrap mb-3">
                          {journal.description}
                        </p>

                        {journal.tags && journal.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {journal.tags.map((tag, i) => (
                              <Tag key={i}>{tag}</Tag>
                            ))}
                          </div>
                        )}

                        {linkedTodo && (
                          <div className="flex items-center gap-2 text-sm text-kingfisher-500 dark:text-kingfisher-400">
                            <LinkIcon size={14} />
                            <span>Gekoppeld aan: {linkedTodo.title}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button size="sm" variant="ghost" onClick={() => openModal(journal)}>
                            <Edit2 size={16} /> Bewerk
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => archiveJournal(journal.id, journal.date, journal.time)}>
                            <Archive size={16} /> Archiveer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteJournal(journal.id, journal.date, journal.time)}
                          >
                            <Trash2 size={16} /> Verwijder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingJournal ? 'Journal Bewerken' : 'Nieuw Journal Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Datum *"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Tijdstip *"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <Input
            label="Categorie"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            list="journal-categories"
          />
          <datalist id="journal-categories">
            {allCategories.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <Input
            label="Tags (komma gescheiden)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="tag1, tag2, tag3"
          />

          <TextArea
            label="Beschrijving *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            required
          />

          <Select
            label="Koppel aan ToDo"
            value={formData.linked_todo_id}
            onChange={(e) => setFormData({ ...formData, linked_todo_id: e.target.value })}
          >
            <option value="">Geen koppeling</option>
            {todos.map(todo => (
              <option key={todo.id} value={todo.id}>{todo.title}</option>
            ))}
          </Select>

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
    </Layout>
  )
}
