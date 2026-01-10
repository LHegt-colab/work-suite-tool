import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/ui/Layout'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge, Tag } from '../components/ui/Badge'
import { Plus, Search, Edit2, Trash2, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function KnowledgePage() {
  const { user } = useAuth()
  const [knowledge, setKnowledge] = useState([])
  const [todos, setTodos] = useState([])
  const [journals, setJournals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKnowledge, setEditingKnowledge] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tags: '',
    url: '',
    description: '',
    linked_todo_ids: [],
    linked_journal_ids: [],
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)

    // Load knowledge
    const { data: knowledgeData } = await supabase
      .from('knowledge')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setKnowledge(knowledgeData || [])

    // Load todos for linking
    const { data: todoData } = await supabase
      .from('todos')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .is('parent_id', null)
      .order('title')

    setTodos(todoData || [])

    // Load journals for linking
    const { data: journalData } = await supabase
      .from('journals')
      .select('id, date, time, description')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('date', { ascending: false })
      .limit(50)

    setJournals(journalData || [])

    // Load categories
    const { data: categoryData } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', user.id)
      .eq('type', 'knowledge')

    setCategories(categoryData?.map(c => c.name) || [])

    setLoading(false)
  }

  const logActivity = async (action, title) => {
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action,
      entity_type: 'knowledge',
      entity_title: title
    })
  }

  const openModal = (item = null) => {
    if (item) {
      setFormData({
        title: item.title,
        category: item.category || '',
        tags: item.tags?.join(', ') || '',
        url: item.url || '',
        description: item.description,
        linked_todo_ids: item.linked_todo_ids || [],
        linked_journal_ids: item.linked_journal_ids || [],
      })
      setEditingKnowledge(item)
    } else {
      setFormData({
        title: '',
        category: '',
        tags: '',
        url: '',
        description: '',
        linked_todo_ids: [],
        linked_journal_ids: [],
      })
      setEditingKnowledge(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingKnowledge(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t)

    const knowledgeData = {
      user_id: user.id,
      title: formData.title,
      category: formData.category || null,
      tags,
      url: formData.url || null,
      description: formData.description,
      linked_todo_ids: formData.linked_todo_ids,
      linked_journal_ids: formData.linked_journal_ids,
    }

    // Save category if new
    if (formData.category && !categories.includes(formData.category)) {
      await supabase.from('categories').insert({
        user_id: user.id,
        type: 'knowledge',
        name: formData.category
      })
    }

    if (editingKnowledge) {
      await supabase
        .from('knowledge')
        .update(knowledgeData)
        .eq('id', editingKnowledge.id)

      await logActivity('update', formData.title)
    } else {
      await supabase.from('knowledge').insert(knowledgeData)
      await logActivity('create', formData.title)
    }

    closeModal()
    loadData()
  }

  const deleteKnowledge = async (id, title) => {
    if (!confirm('Weet je zeker dat je dit knowledge item wilt verwijderen?')) return

    await supabase.from('knowledge').delete().eq('id', id)
    await logActivity('delete', title)
    loadData()
  }

  // Filter knowledge
  const filteredKnowledge = knowledge.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!item.title.toLowerCase().includes(query) &&
          !item.description?.toLowerCase().includes(query) &&
          !item.category?.toLowerCase().includes(query) &&
          !item.tags?.some(t => t.toLowerCase().includes(query))) {
        return false
      }
    }

    if (filterCategory && item.category !== filterCategory) {
      return false
    }

    return true
  })

  // Get unique categories from knowledge
  const allCategories = [...new Set([
    ...categories,
    ...knowledge.map(k => k.category).filter(Boolean)
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
          <h1 className="text-2xl font-bold text-kingfisher-800 dark:text-white">Knowledge Base</h1>
          <Button onClick={() => openModal()}>
            <Plus size={20} />
            Nieuw Knowledge Item
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-kingfisher-400" size={20} />
                <Input
                  placeholder="Zoeken in knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-auto min-w-[180px]"
              >
                <option value="">Alle categorieën</option>
                {allCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>

              {filterCategory && (
                <Button variant="ghost" onClick={() => setFilterCategory('')}>
                  Reset filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge list */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredKnowledge.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="py-8 text-center text-kingfisher-500 dark:text-kingfisher-400">
                Geen knowledge items gevonden
              </CardContent>
            </Card>
          ) : (
            filteredKnowledge.map(item => {
              const linkedTodos = todos.filter(t => item.linked_todo_ids?.includes(t.id))
              const linkedJournals = journals.filter(j => item.linked_journal_ids?.includes(j.id))

              return (
                <Card key={item.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-kingfisher-800 dark:text-kingfisher-100">
                          {item.title}
                        </h3>
                        {item.category && (
                          <Badge variant="default">{item.category}</Badge>
                        )}
                      </div>

                      {/* URL */}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-teal-500 hover:text-teal-600 mb-2"
                        >
                          <ExternalLink size={14} />
                          {new URL(item.url).hostname}
                        </a>
                      )}

                      {/* Description */}
                      <p className="text-sm text-kingfisher-600 dark:text-kingfisher-400 mb-3 flex-1 line-clamp-3">
                        {item.description}
                      </p>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.map((tag, i) => (
                            <Tag key={i}>{tag}</Tag>
                          ))}
                        </div>
                      )}

                      {/* Linked items */}
                      {(linkedTodos.length > 0 || linkedJournals.length > 0) && (
                        <div className="text-xs text-kingfisher-500 dark:text-kingfisher-400 mb-3 space-y-1">
                          {linkedTodos.length > 0 && (
                            <div className="flex items-center gap-1">
                              <LinkIcon size={12} />
                              <span>ToDo's: {linkedTodos.map(t => t.title).join(', ')}</span>
                            </div>
                          )}
                          {linkedJournals.length > 0 && (
                            <div className="flex items-center gap-1">
                              <LinkIcon size={12} />
                              <span>Journals: {linkedJournals.length} item(s)</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs text-kingfisher-400 mb-3">
                        Toegevoegd: {format(new Date(item.created_at), 'dd MMM yyyy', { locale: nl })}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-kingfisher-100 dark:border-kingfisher-700">
                        <Button size="sm" variant="ghost" onClick={() => openModal(item)}>
                          <Edit2 size={16} /> Bewerk
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteKnowledge(item.id, item.title)}
                        >
                          <Trash2 size={16} /> Verwijder
                        </Button>
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
        title={editingKnowledge ? 'Knowledge Bewerken' : 'Nieuw Knowledge Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titel *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Input
            label="Categorie"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            list="knowledge-categories"
          />
          <datalist id="knowledge-categories">
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

          <Input
            label="URL"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
          />

          <TextArea
            label="Beschrijving *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-kingfisher-600 dark:text-kingfisher-300 mb-1.5">
              Koppel aan ToDo's
            </label>
            <select
              multiple
              size={5}
              value={formData.linked_todo_ids}
              onChange={(e) => setFormData({
                ...formData,
                linked_todo_ids: Array.from(e.target.selectedOptions, opt => opt.value)
              })}
              className="w-full px-4 py-2.5 bg-white dark:bg-kingfisher-800 border border-kingfisher-200 dark:border-kingfisher-600 rounded-xl text-kingfisher-800 dark:text-kingfisher-100"
            >
              {todos.map(todo => (
                <option key={todo.id} value={todo.id}>{todo.title}</option>
              ))}
            </select>
            <p className="text-xs text-kingfisher-500 mt-1">Houd Ctrl ingedrukt om meerdere te selecteren</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-kingfisher-600 dark:text-kingfisher-300 mb-1.5">
              Koppel aan Journals
            </label>
            <select
              multiple
              size={5}
              value={formData.linked_journal_ids}
              onChange={(e) => setFormData({
                ...formData,
                linked_journal_ids: Array.from(e.target.selectedOptions, opt => opt.value)
              })}
              className="w-full px-4 py-2.5 bg-white dark:bg-kingfisher-800 border border-kingfisher-200 dark:border-kingfisher-600 rounded-xl text-kingfisher-800 dark:text-kingfisher-100"
            >
              {journals.map(journal => (
                <option key={journal.id} value={journal.id}>
                  {journal.date} {journal.time} - {journal.description.substring(0, 50)}...
                </option>
              ))}
            </select>
            <p className="text-xs text-kingfisher-500 mt-1">Houd Ctrl ingedrukt om meerdere te selecteren</p>
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
    </Layout>
  )
}
