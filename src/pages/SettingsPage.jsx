import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Layout } from '../components/ui/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import {
  Moon,
  Sun,
  Download,
  Upload,
  Archive,
  Trash2,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [stats, setStats] = useState({
    todos: 0,
    journals: 0,
    meetings: 0,
    knowledge: 0,
    archivedTodos: 0,
    archivedJournals: 0,
    archivedMeetings: 0,
  })
  const [loading, setLoading] = useState(true)

  // Export modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    todos: true,
    journals: true,
    meetings: true,
    knowledge: true,
  })

  // Archive modal
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [archiveType, setArchiveType] = useState('')
  const [archivedItems, setArchivedItems] = useState([])

  // Journal export
  const [journalExportDate, setJournalExportDate] = useState('')
  const [journalExportStart, setJournalExportStart] = useState('')
  const [journalExportEnd, setJournalExportEnd] = useState('')

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    setLoading(true)

    const [
      { count: todosCount },
      { count: journalsCount },
      { count: meetingsCount },
      { count: knowledgeCount },
      { count: archivedTodosCount },
      { count: archivedJournalsCount },
      { count: archivedMeetingsCount },
    ] = await Promise.all([
      supabase.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', false),
      supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', false),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', false),
      supabase.from('knowledge').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', true),
      supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', true),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', true),
    ])

    setStats({
      todos: todosCount || 0,
      journals: journalsCount || 0,
      meetings: meetingsCount || 0,
      knowledge: knowledgeCount || 0,
      archivedTodos: archivedTodosCount || 0,
      archivedJournals: archivedJournalsCount || 0,
      archivedMeetings: archivedMeetingsCount || 0,
    })

    setLoading(false)
  }

  const exportToJson = async () => {
    const data = {}

    if (exportOptions.todos) {
      const { data: todos } = await supabase.from('todos').select('*').eq('user_id', user.id)
      const { data: comments } = await supabase.from('todo_comments').select('*').eq('user_id', user.id)
      data.todos = todos
      data.todoComments = comments
    }

    if (exportOptions.journals) {
      const { data: journals } = await supabase.from('journals').select('*').eq('user_id', user.id)
      data.journals = journals
    }

    if (exportOptions.meetings) {
      const { data: meetings } = await supabase.from('meetings').select('*').eq('user_id', user.id)
      const { data: actions } = await supabase.from('meeting_actions').select('*')
      data.meetings = meetings
      data.meetingActions = actions
    }

    if (exportOptions.knowledge) {
      const { data: knowledge } = await supabase.from('knowledge').select('*').eq('user_id', user.id)
      data.knowledge = knowledge
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadFile(blob, `work-suite-backup-${format(new Date(), 'yyyy-MM-dd')}.json`)
    setIsExportModalOpen(false)
  }

  const exportToCsv = async () => {
    let csv = ''

    if (exportOptions.todos) {
      const { data: todos } = await supabase.from('todos').select('*').eq('user_id', user.id)
      csv += 'TODOS\n'
      csv += 'Title,Description,Owner,Start Date,Due Date,Priority,Status,Created At\n'
      todos?.forEach(t => {
        csv += `"${t.title}","${t.description || ''}","${t.owner || ''}","${t.start_date || ''}","${t.due_date || ''}","${t.priority}","${t.status}","${t.created_at}"\n`
      })
      csv += '\n'
    }

    if (exportOptions.journals) {
      const { data: journals } = await supabase.from('journals').select('*').eq('user_id', user.id)
      csv += 'JOURNALS\n'
      csv += 'Date,Time,Category,Tags,Description\n'
      journals?.forEach(j => {
        csv += `"${j.date}","${j.time}","${j.category || ''}","${j.tags?.join(';') || ''}","${j.description}"\n`
      })
      csv += '\n'
    }

    if (exportOptions.meetings) {
      const { data: meetings } = await supabase.from('meetings').select('*').eq('user_id', user.id)
      csv += 'MEETINGS\n'
      csv += 'Date,Time,Subject,Goal,Participants,Notes\n'
      meetings?.forEach(m => {
        csv += `"${m.date}","${m.time}","${m.subject}","${m.goal || ''}","${m.participants?.join(';') || ''}","${m.notes || ''}"\n`
      })
      csv += '\n'
    }

    if (exportOptions.knowledge) {
      const { data: knowledge } = await supabase.from('knowledge').select('*').eq('user_id', user.id)
      csv += 'KNOWLEDGE\n'
      csv += 'Title,Category,Tags,URL,Description\n'
      knowledge?.forEach(k => {
        csv += `"${k.title}","${k.category || ''}","${k.tags?.join(';') || ''}","${k.url || ''}","${k.description}"\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    downloadFile(blob, `work-suite-export-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    setIsExportModalOpen(false)
  }

  const exportToMarkdown = async () => {
    let md = `# Work Suite Export\n\n`
    md += `Geëxporteerd op: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: nl })}\n\n`

    if (exportOptions.todos) {
      const { data: todos } = await supabase.from('todos').select('*').eq('user_id', user.id).eq('is_archived', false)
      md += `## ToDo's\n\n`
      todos?.forEach(t => {
        md += `### ${t.title}\n\n`
        md += `- **Status:** ${t.status}\n`
        md += `- **Prioriteit:** ${t.priority}\n`
        if (t.owner) md += `- **Eigenaar:** ${t.owner}\n`
        if (t.start_date) md += `- **Start:** ${t.start_date}\n`
        if (t.due_date) md += `- **Due:** ${t.due_date}\n`
        if (t.description) md += `\n${t.description}\n`
        md += '\n---\n\n'
      })
    }

    if (exportOptions.journals) {
      const { data: journals } = await supabase.from('journals').select('*').eq('user_id', user.id).eq('is_archived', false).order('date', { ascending: false })
      md += `## Work Journal\n\n`
      journals?.forEach(j => {
        md += `### ${j.date} ${j.time}\n\n`
        if (j.category) md += `**Categorie:** ${j.category}\n\n`
        if (j.tags?.length) md += `**Tags:** ${j.tags.join(', ')}\n\n`
        md += `${j.description}\n\n---\n\n`
      })
    }

    if (exportOptions.meetings) {
      const { data: meetings } = await supabase.from('meetings').select('*').eq('user_id', user.id).eq('is_archived', false)
      md += `## Meetings\n\n`
      meetings?.forEach(m => {
        md += `### ${m.subject}\n\n`
        md += `**Datum:** ${m.date} om ${m.time}\n\n`
        if (m.participants?.length) md += `**Deelnemers:** ${m.participants.join(', ')}\n\n`
        if (m.goal) md += `**Doel:** ${m.goal}\n\n`
        if (m.notes) md += `**Aantekeningen:**\n\n${m.notes}\n\n`
        md += '---\n\n'
      })
    }

    if (exportOptions.knowledge) {
      const { data: knowledge } = await supabase.from('knowledge').select('*').eq('user_id', user.id)
      md += `## Knowledge Base\n\n`
      knowledge?.forEach(k => {
        md += `### ${k.title}\n\n`
        if (k.category) md += `**Categorie:** ${k.category}\n\n`
        if (k.tags?.length) md += `**Tags:** ${k.tags.join(', ')}\n\n`
        if (k.url) md += `**URL:** ${k.url}\n\n`
        md += `${k.description}\n\n---\n\n`
      })
    }

    const blob = new Blob([md], { type: 'text/markdown' })
    downloadFile(blob, `work-suite-export-${format(new Date(), 'yyyy-MM-dd')}.md`)
    setIsExportModalOpen(false)
  }

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result)

        if (!confirm('Dit zal bestaande data aanvullen met de geïmporteerde data. Doorgaan?')) return

        if (data.todos) {
          for (const todo of data.todos) {
            const { id, ...todoData } = todo
            await supabase.from('todos').insert({ ...todoData, user_id: user.id })
          }
        }

        if (data.journals) {
          for (const journal of data.journals) {
            const { id, ...journalData } = journal
            await supabase.from('journals').insert({ ...journalData, user_id: user.id })
          }
        }

        if (data.meetings) {
          for (const meeting of data.meetings) {
            const { id, ...meetingData } = meeting
            await supabase.from('meetings').insert({ ...meetingData, user_id: user.id })
          }
        }

        if (data.knowledge) {
          for (const item of data.knowledge) {
            const { id, ...itemData } = item
            await supabase.from('knowledge').insert({ ...itemData, user_id: user.id })
          }
        }

        alert('Data succesvol geïmporteerd!')
        loadStats()
      } catch (error) {
        alert('Fout bij importeren: ongeldig JSON bestand')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const showArchive = async (type) => {
    setArchiveType(type)

    let data = []
    if (type === 'todos') {
      const { data: items } = await supabase.from('todos').select('*').eq('user_id', user.id).eq('is_archived', true)
      data = items || []
    } else if (type === 'journals') {
      const { data: items } = await supabase.from('journals').select('*').eq('user_id', user.id).eq('is_archived', true)
      data = items || []
    } else if (type === 'meetings') {
      const { data: items } = await supabase.from('meetings').select('*').eq('user_id', user.id).eq('is_archived', true)
      data = items || []
    }

    setArchivedItems(data)
    setIsArchiveModalOpen(true)
  }

  const restoreItem = async (id) => {
    const table = archiveType
    await supabase.from(table).update({ is_archived: false }).eq('id', id)
    setArchivedItems(prev => prev.filter(item => item.id !== id))
    loadStats()
  }

  const deleteArchivedItem = async (id) => {
    if (!confirm('Weet je zeker dat je dit item permanent wilt verwijderen?')) return

    const table = archiveType
    await supabase.from(table).delete().eq('id', id)
    setArchivedItems(prev => prev.filter(item => item.id !== id))
    loadStats()
  }

  const autoArchiveOldItems = async () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    const cutoff = cutoffDate.toISOString().split('T')[0]

    if (!confirm(`Dit archiveert alle voltooide items ouder dan 90 dagen (voor ${cutoff}). Doorgaan?`)) return

    await supabase
      .from('todos')
      .update({ is_archived: true })
      .eq('user_id', user.id)
      .eq('status', 'afgerond')
      .lt('updated_at', cutoff)

    await supabase
      .from('journals')
      .update({ is_archived: true })
      .eq('user_id', user.id)
      .lt('date', cutoff)

    await supabase
      .from('meetings')
      .update({ is_archived: true })
      .eq('user_id', user.id)
      .lt('date', cutoff)

    alert('Items succesvol gearchiveerd!')
    loadStats()
  }

  const exportJournalDay = async () => {
    if (!journalExportDate) {
      alert('Selecteer een datum')
      return
    }

    const { data: journals } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', journalExportDate)
      .order('time')

    if (!journals?.length) {
      alert('Geen journal items gevonden voor deze datum')
      return
    }

    let content = `Work Journal - ${journalExportDate}\n`
    content += '='.repeat(50) + '\n\n'

    journals.forEach(j => {
      content += `${j.time} - ${j.category || 'Algemeen'}\n`
      content += '-'.repeat(50) + '\n'
      content += `${j.description}\n`
      if (j.tags?.length) content += `Tags: ${j.tags.join(', ')}\n`
      content += '\n'
    })

    const blob = new Blob([content], { type: 'text/plain' })
    downloadFile(blob, `journal-${journalExportDate}.txt`)
  }

  const exportJournalWeek = async () => {
    if (!journalExportStart || !journalExportEnd) {
      alert('Selecteer start- en einddatum')
      return
    }

    const { data: journals } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', journalExportStart)
      .lte('date', journalExportEnd)
      .order('date')
      .order('time')

    if (!journals?.length) {
      alert('Geen journal items gevonden voor deze periode')
      return
    }

    let content = `Work Journal - ${journalExportStart} tot ${journalExportEnd}\n`
    content += '='.repeat(50) + '\n\n'

    let currentDate = ''
    journals.forEach(j => {
      if (j.date !== currentDate) {
        currentDate = j.date
        content += `\n${currentDate}\n`
        content += '='.repeat(50) + '\n\n'
      }

      content += `${j.time} - ${j.category || 'Algemeen'}\n`
      content += '-'.repeat(50) + '\n'
      content += `${j.description}\n`
      if (j.tags?.length) content += `Tags: ${j.tags.join(', ')}\n`
      content += '\n'
    })

    const blob = new Blob([content], { type: 'text/plain' })
    downloadFile(blob, `journal-week-${journalExportStart}-${journalExportEnd}.txt`)
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
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-kingfisher-800 dark:text-white">Configuratie</h1>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Thema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kingfisher-600 dark:text-kingfisher-400">
                  Huidige modus: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                </p>
              </div>
              <Button onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                Wissel naar {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card>
          <CardHeader>
            <CardTitle>Data Opslag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-2xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.todos}</div>
                <div className="text-sm text-kingfisher-500">ToDo's</div>
              </div>
              <div className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-2xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.journals}</div>
                <div className="text-sm text-kingfisher-500">Journal Items</div>
              </div>
              <div className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-2xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.meetings}</div>
                <div className="text-sm text-kingfisher-500">Meetings</div>
              </div>
              <div className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-2xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.knowledge}</div>
                <div className="text-sm text-kingfisher-500">Knowledge Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle>Import / Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="success" onClick={() => setIsExportModalOpen(true)}>
                <Download size={20} />
                Exporteer Data
              </Button>
              <div>
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
                <Button variant="primary" onClick={() => document.getElementById('import-file')?.click()}>
                  <Upload size={20} />
                  Importeer van JSON
                </Button>
              </div>
            </div>
            <p className="text-sm text-kingfisher-500 dark:text-kingfisher-400 mt-3">
              Exporteer al je data in verschillende formaten (JSON, CSV, Markdown) of importeer een eerdere backup.
            </p>
          </CardContent>
        </Card>

        {/* Archive */}
        <Card>
          <CardHeader>
            <CardTitle>Archief</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-kingfisher-600 dark:text-kingfisher-400 mb-4">
              Archiveer oude items om je actieve lijst overzichtelijk te houden.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.archivedTodos}</div>
                <div className="text-xs text-kingfisher-500">Gearchiveerde ToDo's</div>
              </div>
              <div className="p-3 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.archivedJournals}</div>
                <div className="text-xs text-kingfisher-500">Gearchiveerde Journals</div>
              </div>
              <div className="p-3 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl text-center">
                <div className="text-xl font-bold text-kingfisher-700 dark:text-kingfisher-200">{stats.archivedMeetings}</div>
                <div className="text-xs text-kingfisher-500">Gearchiveerde Meetings</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => showArchive('todos')}>
                <Archive size={18} /> ToDo Archief
              </Button>
              <Button variant="primary" onClick={() => showArchive('journals')}>
                <Archive size={18} /> Journal Archief
              </Button>
              <Button variant="primary" onClick={() => showArchive('meetings')}>
                <Archive size={18} /> Meeting Archief
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-kingfisher-100 dark:border-kingfisher-700">
              <Button variant="secondary" onClick={autoArchiveOldItems}>
                Auto-archiveer items ouder dan 90 dagen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journal Export */}
        <Card>
          <CardHeader>
            <CardTitle>Journal Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-kingfisher-700 dark:text-kingfisher-300 mb-2">
                  Exporteer Dag naar TXT
                </label>
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={journalExportDate}
                    onChange={(e) => setJournalExportDate(e.target.value)}
                    className="w-auto"
                  />
                  <Button variant="secondary" onClick={exportJournalDay}>
                    Exporteer Dag
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-kingfisher-700 dark:text-kingfisher-300 mb-2">
                  Exporteer Periode naar TXT
                </label>
                <div className="flex flex-wrap gap-3">
                  <Input
                    type="date"
                    value={journalExportStart}
                    onChange={(e) => setJournalExportStart(e.target.value)}
                    className="w-auto"
                    placeholder="Start"
                  />
                  <Input
                    type="date"
                    value={journalExportEnd}
                    onChange={(e) => setJournalExportEnd(e.target.value)}
                    className="w-auto"
                    placeholder="Eind"
                  />
                  <Button variant="secondary" onClick={exportJournalWeek}>
                    Exporteer Periode
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Data Exporteren"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl space-y-2">
            <p className="font-medium text-kingfisher-700 dark:text-kingfisher-300">Wat wil je exporteren?</p>
            {Object.entries(exportOptions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setExportOptions({ ...exportOptions, [key]: e.target.checked })}
                  className="w-4 h-4 text-teal-500 rounded"
                />
                <span className="capitalize">{key}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToJson}
              className="p-4 border-2 border-kingfisher-200 dark:border-kingfisher-600 rounded-xl hover:border-teal-500 transition-colors text-center"
            >
              <FileJson className="mx-auto mb-2 text-teal-500" size={32} />
              <div className="font-medium">JSON</div>
              <div className="text-xs text-kingfisher-500">Volledige backup</div>
            </button>
            <button
              onClick={exportToCsv}
              className="p-4 border-2 border-kingfisher-200 dark:border-kingfisher-600 rounded-xl hover:border-teal-500 transition-colors text-center"
            >
              <FileSpreadsheet className="mx-auto mb-2 text-teal-500" size={32} />
              <div className="font-medium">CSV</div>
              <div className="text-xs text-kingfisher-500">Excel compatibel</div>
            </button>
            <button
              onClick={exportToMarkdown}
              className="p-4 border-2 border-kingfisher-200 dark:border-kingfisher-600 rounded-xl hover:border-teal-500 transition-colors text-center col-span-2"
            >
              <FileText className="mx-auto mb-2 text-teal-500" size={32} />
              <div className="font-medium">Markdown</div>
              <div className="text-xs text-kingfisher-500">Tekst met opmaak</div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title={`${archiveType === 'todos' ? 'ToDo' : archiveType === 'journals' ? 'Journal' : 'Meeting'} Archief`}
        size="lg"
      >
        {archivedItems.length === 0 ? (
          <p className="text-center text-kingfisher-500 py-8">Geen gearchiveerde items</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {archivedItems.map(item => (
              <div key={item.id} className="p-4 bg-kingfisher-50 dark:bg-kingfisher-800/50 rounded-xl">
                <div className="font-medium text-kingfisher-800 dark:text-kingfisher-100">
                  {item.title || item.subject || `${item.date} ${item.time}`}
                </div>
                {item.description && (
                  <p className="text-sm text-kingfisher-600 dark:text-kingfisher-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="success" onClick={() => restoreItem(item.id)}>
                    Herstellen
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteArchivedItem(item.id)}>
                    <Trash2 size={14} /> Verwijderen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  )
}
