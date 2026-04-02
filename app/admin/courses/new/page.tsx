'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getNextOrder } from '@/lib/content'

export default function NewCoursePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const prefilledSubjectId = searchParams.get('subject_id') ?? ''

  const [name,      setName]      = useState('')
  const [order,     setOrder]     = useState<number | null>(null)  // null = calcul en cours
  const [subjectId, setSubjectId] = useState(prefilledSubjectId)
  const [subjects,  setSubjects]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Chargement des matières
  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => {
      if (data) {
        setSubjects(data)
        if (!prefilledSubjectId && data.length > 0) setSubjectId(String(data[0].id))
      }
    })
  }, [prefilledSubjectId])

  // Recalcule l'ordre automatiquement à chaque changement de matière
  useEffect(() => {
    if (!subjectId) return
    getNextOrder('courses', 'subject_id', Number(subjectId)).then(setOrder)
  }, [subjectId])

  async function handleSubmit() {
    if (!name.trim() || !subjectId || order === null) {
      setError('Le nom et la matière sont obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('courses').insert({
      title: name.trim(),
      order,
      subject_id: Number(subjectId),
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push(prefilledSubjectId ? '/admin/subjects' : '/admin/courses')
  }

  return (
    <div style={{maxWidth:'480px'}}>
      <h1 style={{fontSize:'1.5rem',fontWeight:600,marginBottom:'1.5rem',color:'#1a1a18'}}>Nouveau cours</h1>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

        <div>
          <label style={{display:'block',marginBottom:'0.5rem',fontSize:'12px',color:'#5f5e5a'}}>Matière parente</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
            style={{width:'100%',background:'#f4f3ef',color:'#1a1a18',border:'0.5px solid rgba(0,0,0,0.22)',borderRadius:'8px',padding:'0.625rem',fontSize:'13px'}}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.level.toUpperCase()})</option>)}
          </select>
        </div>

        <div>
          <label style={{display:'block',marginBottom:'0.5rem',fontSize:'12px',color:'#5f5e5a'}}>
            Nom du cours
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex : Membre supérieur"
            style={{width:'100%',background:'#f4f3ef',color:'#1a1a18',border:'0.5px solid rgba(0,0,0,0.22)',borderRadius:'8px',padding:'0.625rem',fontSize:'13px'}} />
        </div>

        {/* Ordre affiché en lecture seule — calculé automatiquement */}
        <div style={{fontSize:'12px',color:'#888780'}}>
          Ordre automatique : <strong style={{color:'#1a1a18'}}>#{order ?? '…'}</strong>
        </div>

        {error && <div style={{background:'#fcebeb',color:'#791f1f',padding:'10px 14px',borderRadius:'8px',fontSize:'13px'}}>⚠ {error}</div>}

        <button onClick={handleSubmit} disabled={loading || order === null}
          style={{background:'#378ADD',color:'white',padding:'0.625rem',borderRadius:'8px',border:'none',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>
          {loading ? 'Enregistrement...' : 'Créer le cours'}
        </button>
        <a href={prefilledSubjectId ? '/admin/subjects' : '/admin/courses'}
          style={{color:'#888780',textAlign:'center',textDecoration:'none',fontSize:'13px'}}>Annuler</a>
      </div>
    </div>
  )
}
