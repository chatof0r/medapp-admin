import { supabase } from '@/lib/supabase'

async function getChapters() {
  const { data, error } = await supabase
    .from('chapters')
    .select('*, courses(title, subjects(name))')
    .order('order', { ascending: true })
  if (error) return []
  return data
}

export default async function ChaptersPage() {
  const chapters = await getChapters()
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div>
          <h1 style={{fontSize:'2rem',fontWeight:'bold'}}>Chapitres</h1>
          <p style={{color:'#9ca3af',marginTop:'0.25rem'}}>{chapters.length} chapitre(s)</p>
        </div>
        <a href="/admin/chapters/new" style={{background:'#2563eb',color:'white',padding:'0.5rem 1rem',borderRadius:'0.5rem',textDecoration:'none'}}>
          + Nouveau chapitre
        </a>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {chapters.length === 0 && (
          <div style={{background:'#111827',borderRadius:'1rem',padding:'2rem',textAlign:'center',color:'#9ca3af'}}>
            Aucun chapitre pour l&apos;instant.
          </div>
        )}
        {chapters.map((chapter: any) => (
          <div key={chapter.id} style={{background:'#111827',borderRadius:'1rem',padding:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2 style={{fontWeight:'600'}}>{chapter.title}</h2>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginTop:'0.25rem'}}>
                {chapter.courses?.subjects?.name} &rsaquo; {chapter.courses?.title} — Ordre {chapter.order}
              </p>
            </div>
            <a href={`/admin/chapters/${chapter.id}/edit`} style={{color:'#60a5fa',fontSize:'0.875rem',textDecoration:'none'}}>
              Modifier
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
