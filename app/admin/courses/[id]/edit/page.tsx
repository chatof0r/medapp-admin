'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => {
      if (data) setSubjects(data)
    })
    supabase.from('courses').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setName(data.title)
        setSubjectId(data.subject_id)
      }
    })
  }, [params.id])

  async function handleSave() {
    setLoading(true)
    await supabase.from('courses').update({ title: name, subject_id: subjectId }).eq('id', params.id)
    router.push('/admin/courses')
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce cours ? Cette action est irréversible.')) return
    setDeleting(true)
    await supabase.from('courses').delete().eq('id', params.id)
    router.push('/admin/courses')
  }

  return (
    <div style={{maxWidth:'480px'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'2rem'}}>Modifier le cours</h1>

      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Matière</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Nom du cours</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{background:'#2563eb',color:'white',padding:'0.75rem',borderRadius:'0.5rem',border:'none',fontSize:'1rem',fontWeight:'600',cursor:'pointer'}}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{background:'#7f1d1d',color:'#fca5a5',padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #991b1b',fontSize:'1rem',fontWeight:'600',cursor:'pointer'}}
        >
          {deleting ? 'Suppression...' : 'Supprimer le cours'}
        </button>
        <a href="/admin/courses" style={{color:'#9ca3af',textAlign:'center',textDecoration:'none'}}>
          Annuler
        </a>
      </div>
    </div>
  )
}
