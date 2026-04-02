'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewFlashcardPage() {
  const router = useRouter()
  const [frontText, setFrontText] = useState('')
  const [backText,  setBackText]  = useState('')
  const [imageUrl,  setImageUrl]  = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sections,  setSections]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    supabase
      .from('sections')
      .select('*, chapters(title, courses(title, subjects(name)))')
      .order('title')
      .then(({ data }) => {
        if (data) {
          setSections(data)
          if (data.length > 0) setSectionId(data[0].id)
        }
      })
  }, [])

  async function handleSubmit() {
    if (!frontText || !backText || !sectionId) return
    setLoading(true)
    await supabase.from('flashcards').insert({
      front_text: frontText,
      back_text:  backText,
      image_url:  imageUrl || null,
      section_id: sectionId,
    })
    router.push('/admin/flashcards')
  }

  return (
    <div style={{maxWidth:'640px'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'2rem'}}>Nouvelle flashcard</h1>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Section</label>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.chapters?.courses?.subjects?.name} › {s.chapters?.title} › {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Recto (question)</label>
          <textarea value={frontText} onChange={e => setFrontText(e.target.value)} rows={3}
            placeholder="Question ou terme à mémoriser..."
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem',resize:'vertical',fontFamily:'inherit'}} />
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Verso (réponse)</label>
          <textarea value={backText} onChange={e => setBackText(e.target.value)} rows={5}
            placeholder="Insertion : ... ; Trajet : ... ; Terminaison : ... ; Innervation : ... ; Rôles : ..."
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem',resize:'vertical',fontFamily:'inherit'}} />
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>URL image (optionnel)</label>
          <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}} />
        </div>
        <button onClick={handleSubmit} disabled={loading}
          style={{background:'#2563eb',color:'white',padding:'0.75rem',borderRadius:'0.5rem',border:'none',fontSize:'1rem',fontWeight:'600',cursor:'pointer'}}>
          {loading ? 'Enregistrement...' : 'Créer la flashcard'}
        </button>
        <a href="/admin/flashcards" style={{color:'#9ca3af',textAlign:'center',textDecoration:'none'}}>Annuler</a>
      </div>
    </div>
  )
}
