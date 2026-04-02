'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditChapterPage() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [order, setOrder] = useState(1)
  const [courseId, setCourseId] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('courses').select('*, subjects(name)').order('title').then(({ data }) => {
      if (data) setCourses(data)
    })
    supabase.from('chapters').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setName(data.title)
        setOrder(data.order)
        setCourseId(data.course_id)
      }
    })
  }, [params.id])

  async function handleSave() {
    setLoading(true)
    await supabase.from('chapters').update({ title: name, order, course_id: courseId }).eq('id', params.id)
    router.push('/admin/chapters')
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce chapitre ? Cette action est irréversible.')) return
    setDeleting(true)
    await supabase.from('chapters').delete().eq('id', params.id)
    router.push('/admin/chapters')
  }

  return (
    <div style={{maxWidth:'480px'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'2rem'}}>Modifier le chapitre</h1>

      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Cours parent</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.subjects?.name} — {c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Nom du chapitre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}
          />
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Ordre</label>
          <input
            type="number"
            value={order}
            min={1}
            onChange={(e) => setOrder(Number(e.target.value))}
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
          {deleting ? 'Suppression...' : 'Supprimer le chapitre'}
        </button>
        <a href="/admin/chapters" style={{color:'#9ca3af',textAlign:'center',textDecoration:'none'}}>
          Annuler
        </a>
      </div>
    </div>
  )
}
