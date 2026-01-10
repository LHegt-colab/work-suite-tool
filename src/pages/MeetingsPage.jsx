import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/ui/Layout'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge, Tag } from '../components/ui/Badge'
import { Plus, Search, Edit2, Trash2, Users, Calendar, Target, Archive, CheckCircle } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'

export function MeetingsPage() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    subject: '',
    goal: '',
    participants: '',
    notes: '',
    actions: []
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)

    // Load meetings with actions
    const { data: meetingData } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    // Load actions for each meeting
    const meetingsWithActions = await Promise.all(
      (meetingData || []).map(async (meeting) => {
        const { data: actions } = await supabase
          .from('meeting_actions')
          .select('*')
          .eq('meeting_id', meeting.id)
          .order('created_at')

        return { ...meeting, actions: actions || [] }
      })
    )

    setMeetings(meetingsWithActions)

    // Load todos for linking
    const { data: todoData } = await supabase
      .from('todos')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .is('parent_id', null)
      .order('title')

    setTodos(todoData || [])

    setLoading(false)
  }

  const logActivity = async (action, title) => {
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action,
      entity_type: 'meeting',
      entity_title: title
    })
  }

  const openModal = (meeting = null) => {
    if (meeting) {
      setFormData({
        date: meeting.date,
        time: meeting.time,
        subject: meeting.subject,
        goal: meeting.goal || '',
        participants: meeting.participants?.join(', ') || '',
        notes: meeting.notes || '',
        actions: meeting.actions || []
      })
      setEditingMeeting(meeting)
    } else {
      setFormData({
        date: '',
        time: '',
        subject: '',
        goal: '',
        participants: '',
        notes: '',
        actions: []
      })
      setEditingMeeting(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingMeeting(null)
  }

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { id: Date.now(), description: '', assignee: '', due_date: '', linked_todo_id: '', is_completed: false }
      ]
    })
  }

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setFormData({ ...formData, actions: newActions })
  }

  const removeAction = (index) => {
    const newActions = formData.actions.filter((_, i) => i !== index)
    setFormData({ ...formData, actions: newActions })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const participants = formData.participants
      .split(',')
      .map(p => p.trim())
      .filter(p => p)

    const meetingData = {
      user_id: user.id,
      date: formData.date,
      time: formData.time,
      subject: formData.subject,
      goal: formData.goal || null,
      participants,
      notes: formData.notes || null,
    }

    let meetingId

    if (editingMeeting) {
      await supabase
        .from('meetings')
        .update(meetingData)
        .eq('id', editingMeeting.id)

      meetingId = editingMeeting.id

      // Delete old actions
      await supabase
        .from('meeting_actions')
        .delete()
        .eq('meeting_id', editingMeeting.id)

      await logActivity('update', formData.subject)
    } else {
      const { data } = await supabase
        .from('meetings')
        .insert(meetingData)
        .select()
        .single()

      meetingId = data.id
      await logActivity('create', formData.subject)
    }

    // Insert actions
    if (formData.actions.length > 0) {
      const actionsToInsert = formData.actions.map(action => ({
        meeting_id: meetingId,
        description: action.description,
        assignee: action.assignee || null,
        due_date: action.due_date || null,
        linked_todo_id: action.linked_todo_id || null,
        is_completed: action.is_completed
      }))

      await supabase.from('meeting_actions').insert(actionsToInsert)
    }

    closeModal()
    loadData()
  }

  const deleteMeeting = async (id, subject) => {
    if (!confirm('Weet je zeker dat je deze meeting wilt verwijderen?')) return

    await supabase.from('meeting_actions').delete().eq('meeting_id', id)
    await supabase.from('meetings').delete().eq('id', id)
    await logActivity('delete', subject)
    loadData()
  }

  const archiveMeeting = async (id, subject) => {
    await supabase
      .from('meetings')
      .update({ is_archived: true })
      .eq('id', id)

    await logActivity('archive', subject)
    loadData()
  }

  const toggleActionComplete = async (meetingId, actionId, currentStatus) => {
    await supabase
      .from('meeting_actions')
      .update({ is_completed: !currentStatus })
      .eq('id', actionId)

    loadData()
  }

  // Filter meetings
  const today = new Date().toISOString().split('T')[0]

  const filteredMeetings = meetings.filter(meeting => {
    // Tab filter
    if (activeTab === 'upcoming' && meeting.date < today) return false
    if (activeTab === 'past' && meeting.date >= today) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!meeting.subject.toLowerCase().includes(query) &&
          !meeting.participants?.some(p => p.toLowerCase().includes(query))) {
        return false
      }
    }

    return true
  })

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
          <h1 className="text-2xl font-bold text-kingfisher-800 dark:text-white">Meeting Notes</h1>
          <Button onClick={() => openModal()}>
            <Plus size={20} />
            Nieuwe Meeting
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'upcoming', label: 'Aankomende' },
            { key: 'past', label: 'Afgelopen' },
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

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-kingfisher-400" size={20} />
              <Input
                placeholder="Zoek in onderwerp of deelnemers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Meetings list */}
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-kingfisher-500 dark:text-kingfisher-400">
                Geen meetings gevonden
              </CardContent>
            </Card>
          ) : (
            filteredMeetings.map(meeting => (
              <Card key={meeting.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-kingfisher-800 dark:text-kingfisher-100">
                          {meeting.subject}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-kingfisher-500 dark:text-kingfisher-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(meeting.date), 'dd MMMM yyyy', { locale: nl })} om {meeting.time}
                          </span>
                          {meeting.participants?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {meeting.participants.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Goal */}
                    {meeting.goal && (
                      <div className="flex items-start gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                        <Target size={18} className="text-teal-500 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Doel:</span>
                          <p className="text-sm text-teal-600 dark:text-teal-400">{meeting.goal}</p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {meeting.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-kingfisher-700 dark:text-kingfisher-300 mb-1">
                          Aantekeningen:
                        </h4>
                        <p className="text-sm text-kingfisher-600 dark:text-kingfisher-400 whitespace-pre-wrap">
                          {meeting.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {meeting.actions?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-kingfisher-700 dark:text-kingfisher-300 mb-2">
                          Acties ({meeting.actions.filter(a => a.is_completed).length}/{meeting.actions.length} afgerond):
                        </h4>
                        <div className="space-y-2">
                          {meeting.actions.map(action => (
                            <div
                              key={action.id}
                              className={`
                                flex items-start gap-3 p-3 rounded-xl
                                ${action.is_completed
                                  ? 'bg-teal-50 dark:bg-teal-900/20'
                                  : 'bg-kingfisher-50 dark:bg-kingfisher-800/50'
                                }
                              `}
                            >
                              <button
                                onClick={() => toggleActionComplete(meeting.id, action.id, action.is_completed)}
                                className={`
                                  mt-0.5 flex-shrink-0
                                  ${action.is_completed ? 'text-teal-500' : 'text-kingfisher-300'}
                                `}
                              >
                                <CheckCircle size={20} />
                              </button>
                              <div className="flex-1">
                                <p className={`text-sm ${action.is_completed ? 'line-through text-kingfisher-400' : 'text-kingfisher-700 dark:text-kingfisher-300'}`}>
                                  {action.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-kingfisher-500">
                                  {action.assignee && <span>Verantwoordelijke: {action.assignee}</span>}
                                  {action.due_date && <span>Due: {format(new Date(action.due_date), 'dd MMM yyyy', { locale: nl })}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-kingfisher-100 dark:border-kingfisher-700">
                      <Button size="sm" variant="ghost" onClick={() => openModal(meeting)}>
                        <Edit2 size={16} /> Bewerk
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => archiveMeeting(meeting.id, meeting.subject)}>
                        <Archive size={16} /> Archiveer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteMeeting(meeting.id, meeting.subject)}
                      >
                        <Trash2 size={16} /> Verwijder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMeeting ? 'Meeting Bewerken' : 'Nieuwe Meeting'}
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
              label="Tijd *"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <Input
            label="Onderwerp *"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <TextArea
            label="Doel van de meeting"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            rows={2}
          />

          <Input
            label="Deelnemers (komma gescheiden)"
            value={formData.participants}
            onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
            placeholder="Jan, Piet, Marie"
          />

          <TextArea
            label="Aantekeningen"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-kingfisher-600 dark:text-kingfisher-300">
                Acties
              </label>
              <Button type="button" size="sm" variant="secondary" onClick={addAction}>
                <Plus size={16} /> Actie toevoegen
              </Button>
            </div>

            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div key={action.id || index} className="p-3 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Beschrijving actie"
                      value={action.description}
                      onChange={(e) => updateAction(index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Verantwoordelijke"
                      value={action.assignee}
                      onChange={(e) => updateAction(index, 'assignee', e.target.value)}
                    />
                    <Input
                      type="date"
                      value={action.due_date}
                      onChange={(e) => updateAction(index, 'due_date', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
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
