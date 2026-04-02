'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditFlashcardPage() {
  const params = useParams()
  const router = useRouter()
  const [frontText, setFrontText] = useState('')
  const [backText,  setBackText]  = useState('')
  const [imageUrl,  setImageUrl]  = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sections,  setSections]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    supabase
      .from('sections')
      .select('*, chapters(title, courses(title, subjects(name)))')
      .order('title')
      .then(({ data }) => {
        if (data) setSections(data)
      })
    supabase.from('flashcards').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setFrontText(data.front_text)
        setBackText(data.back_text)
        setImageUrl(data.image_url ?? '')
        setSectionId(String(data.section_id))
      }
    })
  }, [params.id])

  async function handleSave() {
    setLoading(true)
    await supabase.from('flashcards').update({
      front_text: frontText,
      back_text:  backText,
      image_url:  imageUrl || null,
      section_id: Number(sectionId),
    }).eq('id', params.id)
    router.push('/admin/flashcards')
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette flashcard ? Cette action est irréversible.')) return
    setDeleting(true)
    await supabase.from('flashcards').delete().eq('id', params.id)
    router.push('/admin/flashcards')
  }

  const inputStyle = {
    width: '100%', background: '#f4f3ef', color: '#1a1a18',
    border: '0.5px solid rgba(0,0,0,0.22)', borderRadius: '8px',
    padding: '0.625rem', fontSize: '13px',
  }
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '12px', color: '#5f5e5a' }

  return (
    <div style={{ maxWidth: '560px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1a1a18' }}>
        Modifier la flashcard
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div>
          <label style={labelStyle}>Section parente</label>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} style={inputStyle}>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.chapters?.courses?.subjects?.name} › {s.chapters?.courses?.title} › {s.chapters?.title} › {s.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Recto (question)</label>
          <textarea
            value={frontText}
            onChange={e => setFrontText(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={labelStyle}>Verso (réponse)</label>
          <textarea
            value={backText}
            onChange={e => setBackText(e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={labelStyle}>URL image (optionnel)</label>
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
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
          {deleting ? 'Suppression...' : 'Supprimer la flashcard'}
        </button>

        <a href="/admin/flashcards" style={{ color: '#888780', textAlign: 'center', textDecoration: 'none', fontSize: '13px' }}>
          Annuler
        </a>
      </div>
    </div>
  )
}
