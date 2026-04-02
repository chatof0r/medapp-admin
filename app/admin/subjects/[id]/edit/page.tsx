'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditSubjectPage() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [level, setLevel] = useState('p2')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('subjects').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setName(data.name)
        setLevel(data.level)
      }
    })
  }, [params.id])

  async function handleSave() {
    setLoading(true)
    await supabase.from('subjects').update({ name, level }).eq('id', params.id)
    router.push('/admin/subjects')
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette matière ? Cette action est irréversible.')) return
    setDeleting(true)
    await supabase.from('subjects').delete().eq('id', params.id)
    router.push('/admin/subjects')
  }

  return (
    <div style={{maxWidth:'480px'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'2rem'}}>Modifier la matière</h1>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}
          />
        </div>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Niveau</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{width:'100%',background:'#111827',color:'white',border:'1px solid #374151',borderRadius:'0.5rem',padding:'0.75rem',fontSize:'1rem'}}
          >
            <option value="p2">P2</option>
            <option value="d1">D1</option>
          </select>
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
          {deleting ? 'Suppression...' : 'Supprimer la matière'}
        </button>
        <a href="/admin/subjects" style={{color:'#9ca3af',textAlign:'center',textDecoration:'none'}}>
          Annuler
        </a>
      </div>
    </div>
  )
}
