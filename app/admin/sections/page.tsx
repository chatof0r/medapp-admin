import { supabase } from '@/lib/supabase'

async function getSections() {
  const { data, error } = await supabase
    .from('sections')
    .select('*, chapters(name, courses(name, subjects(name)))')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export default async function SectionsPage() {
  const sections = await getSections()
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div>
          <h1 style={{fontSize:'2rem',fontWeight:'bold'}}>Sections</h1>
          <p style={{color:'#9ca3af',marginTop:'0.25rem'}}>{sections.length} section(s)</p>
        </div>
        <a href="/admin/sections/new" style={{background:'#2563eb',color:'white',padding:'0.5rem 1rem',borderRadius:'0.5rem',textDecoration:'none'}}>
          + Nouvelle section
        </a>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {sections.length === 0 && (
          <div style={{background:'#111827',borderRadius:'1rem',padding:'2rem',textAlign:'center',color:'#9ca3af'}}>
            Aucune section pour l&apos;instant.
          </div>
        )}
        {sections.map((section: any) => (
          <div key={section.id} style={{background:'#111827',borderRadius:'1rem',padding:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <h2 style={{fontWeight:'600'}}>{section.title}</h2>
                <span style={{
                  fontSize:'0.75rem',
                  padding:'0.125rem 0.5rem',
                  borderRadius:'9999px',
                  background: section.status === 'published' ? '#14532d' : '#374151',
                  color: section.status === 'published' ? '#86efac' : '#9ca3af',
                }}>
                  {section.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginTop:'0.25rem'}}>
                {section.chapters?.courses?.subjects?.name} &rsaquo; {section.chapters?.courses?.name} &rsaquo; {section.chapters?.name}
              </p>
            </div>
            <a href={`/admin/sections/${section.id}/edit`} style={{color:'#60a5fa',fontSize:'0.875rem',textDecoration:'none'}}>
              Modifier
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
