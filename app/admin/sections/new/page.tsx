'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getNextOrder } from '@/lib/content'

export default function NewSectionPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const prefilledChapterId = searchParams.get('chapter_id') ?? ''

  const [title,     setTitle]     = useState('')
  const [order,     setOrder]     = useState<number | null>(null)
  const [status,    setStatus]    = useState('draft')
  const [isFree,    setIsFree]    = useState(false)
  const [chapterId, setChapterId] = useState(prefilledChapterId)
  const [chapters,  setChapters]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    supabase.from('chapters').select('*, courses(title, subjects(name))').order('order').then(({ data }) => {
      if (data) {
        setChapters(data)
        if (!prefilledChapterId && data.length > 0) setChapterId(String(data[0].id))
      }
    })
  }, [prefilledChapterId])

  useEffect(() => {
    if (!chapterId) return
    getNextOrder('sections', 'chapter_id', Number(chapterId)).then(setOrder)
  }, [chapterId])

  async function handleSubmit() {
    if (!title.trim() || !chapterId || order === null) {
      setError('Le titre et le chapitre parent sont obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('sections').insert({
      title: title.trim(),
      order,
      status,
      is_free: isFree,
      chapter_id: Number(chapterId),
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push(prefilledChapterId ? '/admin/subjects' : '/admin/sections')
  }

  const inputStyle = {
    width: '100%', background: '#f4f3ef', color: '#1a1a18',
    border: '0.5px solid rgba(0,0,0,0.22)', borderRadius: '8px',
    padding: '0.625rem', fontSize: '13px',
  }
  const labelStyle = {
    display: 'block', marginBottom: '0.5rem', fontSize: '12px', color: '#5f5e5a',
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1a1a18' }}>
        Nouvelle section
      </h1>
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
          <label style={labelStyle}>Titre de la section</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Innervation, Vascularisation..."
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

        <div style={{ fontSize: '12px', color: '#888780' }}>
          Ordre automatique : <strong style={{ color: '#1a1a18' }}>#{order ?? '…'}</strong>
        </div>

        {error && (
          <div style={{ background: '#fcebeb', color: '#791f1f', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
            ⚠ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || order === null}
          style={{
            background: '#378ADD', color: 'white', padding: '0.625rem',
            borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          {loading ? 'Enregistrement...' : 'Créer la section'}
        </button>

        <a
          href={prefilledChapterId ? '/admin/subjects' : '/admin/sections'}
          style={{ color: '#888780', textAlign: 'center', textDecoration: 'none', fontSize: '13px' }}
        >
          Annuler
        </a>
      </div>
    </div>
  )
}
