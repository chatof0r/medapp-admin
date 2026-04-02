'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditSectionPage() {
  const params = useParams()
  const router = useRouter()
  const [title,     setTitle]     = useState('')
  const [status,    setStatus]    = useState('draft')
  const [isFree,    setIsFree]    = useState(false)
  const [chapterId, setChapterId] = useState('')
  const [chapters,  setChapters]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    supabase
      .from('chapters')
      .select('*, courses(title, subjects(name))')
      .order('order')
      .then(({ data }) => {
        if (data) setChapters(data)
      })
    supabase.from('sections').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setTitle(data.title)
        setStatus(data.status ?? 'draft')
        setIsFree(data.is_free ?? false)
        setChapterId(String(data.chapter_id))
      }
    })
  }, [params.id])

  async function handleSave() {
    setLoading(true)
    await supabase
      .from('sections')
      .update({ title, status, is_free: isFree, chapter_id: Number(chapterId) })
      .eq('id', params.id)
    router.push('/admin/sections')
  }

  async function togglePublish() {
    const newStatus = status === 'published' ? 'draft' : 'published'
    await supabase.from('sections').update({ status: newStatus }).eq('id', params.id)
    setStatus(newStatus)
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette section ? Cette action est irréversible.')) return
    setDeleting(true)
    await supabase.from('sections').delete().eq('id', params.id)
    router.push('/admin/sections')
  }

  const inputStyle = {
    width: '100%', background: '#f4f3ef', color: '#1a1a18',
    border: '0.5px solid rgba(0,0,0,0.22)', borderRadius: '8px',
    padding: '0.625rem', fontSize: '13px',
  }
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '12px', color: '#5f5e5a' }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a18' }}>Modifier la section</h1>
        <button
          onClick={togglePublish}
          style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: status === 'published' ? '#fcebeb' : '#eaf3de',
            color:      status === 'published' ? '#791f1f' : '#27500a',
          }}
        >
          {status === 'published' ? 'Dépublier' : 'Publier'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Chapitre parent</label>
          <select value={chapterId} onChange={e => setChapterId(e.target.value)} style={inputStyle}>
            {chapters.map(c => (
              <option key={c.id} value={c.id}>
                {c.courses?.subjects?.name} › {c.courses?.title} › {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Titre</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Statut</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="isFree"
            checked={isFree}
            onChange={e => setIsFree(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="isFree" style={{ fontSize: '13px', color: '#5f5e5a', cursor: 'pointer' }}>
            Section gratuite (accessible sans abonnement)
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          style={{ background: '#378ADD', color: 'white', padding: '0.625rem', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ background: '#fcebeb', color: '#791f1f', padding: '0.625rem', borderRadius: '8px', border: '0.5px solid rgba(121,31,31,0.3)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          {deleting ? 'Suppression...' : 'Supprimer la section'}
        </button>

        <a href="/admin/sections" style={{ color: '#888780', textAlign: 'center', textDecoration: 'none', fontSize: '13px' }}>
          Annuler
        </a>
      </div>
    </div>
  )
}
