import { supabase } from '@/lib/supabase'

async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, subjects(name)')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export default async function CoursesPage() {
  const courses = await getCourses()
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div>
          <h1 style={{fontSize:'2rem',fontWeight:'bold'}}>Cours</h1>
          <p style={{color:'#9ca3af',marginTop:'0.25rem'}}>{courses.length} cours</p>
        </div>
        <a href="/admin/courses/new" style={{background:'#2563eb',color:'white',padding:'0.5rem 1rem',borderRadius:'0.5rem',textDecoration:'none'}}>
          + Nouveau cours
        </a>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {courses.length === 0 && (
          <div style={{background:'#111827',borderRadius:'1rem',padding:'2rem',textAlign:'center',color:'#9ca3af'}}>
            Aucun cours pour l&apos;instant.
          </div>
        )}
        {courses.map((course: any) => (
          <div key={course.id} style={{background:'#111827',borderRadius:'1rem',padding:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2 style={{fontWeight:'600'}}>{course.title}</h2>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginTop:'0.25rem'}}>
                {course.subjects?.name} — {course.level?.toUpperCase()}
              </p>
            </div>
            <a href={`/admin/courses/${course.id}/edit`} style={{color:'#60a5fa',fontSize:'0.875rem',textDecoration:'none'}}>
              Modifier
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
