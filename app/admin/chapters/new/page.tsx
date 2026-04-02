'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getNextOrder } from '@/lib/content'

export default function NewChapterPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const prefilledCourseId = searchParams.get('course_id') ?? ''

  const [name,     setName]     = useState('')
  const [order,    setOrder]    = useState<number | null>(null)
  const [courseId, setCourseId] = useState(prefilledCourseId)
  const [courses,  setCourses]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Chargement des chapitres parents
  useEffect(() => {
    supabase.from('courses').select('*, subjects(name)').order('order').then(({ data }) => {
      if (data) {
        setCourses(data)
        if (!prefilledCourseId && data.length > 0) setCourseId(String(data[0].id))
      }
    })
  }, [prefilledCourseId])

  // Recalcule l'ordre automatiquement à chaque changement de chapitre parent
  useEffect(() => {
    if (!courseId) return
    getNextOrder('chapters', 'course_id', Number(courseId)).then(setOrder)
  }, [courseId])

  async function handleSubmit() {
    if (!name.trim() || !courseId || order === null) {
      setError('Le nom et le chapitre parent sont obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('chapters').insert({
      title: name.trim(),
      order,
      course_id: Number(courseId),
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push(prefilledCourseId ? '/admin/subjects' : '/admin/chapters')
  }

  return (
    <div style={{maxWidth:'480px'}}>
      <h1 style={{fontSize:'1.5rem',fontWeight:600,marginBottom:'1.5rem',color:'#1a1a18'}}>Nouveau chapitre</h1>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

        <div>
          <label style={{display:'block',marginBottom:'0.5rem',fontSize:'12px',color:'#5f5e5a'}}>Cours parent</label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)}
            style={{width:'100%',background:'#f4f3ef',color:'#1a1a18',border:'0.5px solid rgba(0,0,0,0.22)',borderRadius:'8px',padding:'0.625rem',fontSize:'13px'}}>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.subjects?.name} › {c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{display:'block',marginBottom:'0.5rem',fontSize:'12px',color:'#5f5e5a'}}>Nom du chapitre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex : Genou, Aorte..."
            style={{width:'100%',background:'#f4f3ef',color:'#1a1a18',border:'0.5px solid rgba(0,0,0,0.22)',borderRadius:'8px',padding:'0.625rem',fontSize:'13px'}} />
        </div>

        <div style={{fontSize:'12px',color:'#888780'}}>
          Ordre automatique : <strong style={{color:'#1a1a18'}}>#{order ?? '…'}</strong>
        </div>

        {error && <div style={{background:'#fcebeb',color:'#791f1f',padding:'10px 14px',borderRadius:'8px',fontSize:'13px'}}>⚠ {error}</div>}

        <button onClick={handleSubmit} disabled={loading || order === null}
          style={{background:'#378ADD',color:'white',padding:'0.625rem',borderRadius:'8px',border:'none',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>
          {loading ? 'Enregistrement...' : 'Créer le chapitre'}
        </button>
        <a href={prefilledCourseId ? '/admin/subjects' : '/admin/chapters'}
          style={{color:'#888780',textAlign:'center',textDecoration:'none',fontSize:'13px'}}>Annuler</a>
      </div>
    </div>
  )
}
