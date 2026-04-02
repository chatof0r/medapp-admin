'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewSubjectPage() {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('p2')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('subjects').insert({ name, level })
    router.push('/admin/subjects')
  }

  return (
    <div style={{maxWidth:'480px'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'2rem'}}>Nouvelle matiere</h1>
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div>
          <label style={{display:'block',marginBottom:'0.5rem',color:'#9ca3af'}}>Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
          type="submit"
          disabled={loading}
          style={{background:'#2563eb',color:'white',padding:'0.75rem',borderRadius:'0.5rem',border:'none',fontSize:'1rem',fontWeight:'600',cursor:'pointer'}}
        >
          {loading ? 'Enregistrement...' : 'Créer la matière'}
        </button>
        <a href="/admin/subjects" style={{color:'#9ca3af',textAlign:'center',textDecoration:'none'}}>
          Annuler
        </a>
      </form>
    </div>
  )
}
