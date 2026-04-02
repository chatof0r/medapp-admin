import { supabase } from '@/lib/supabase'

async function getFlashcards() {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*, sections(title, chapters(name, courses(name, subjects(name))))')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export default async function FlashcardsPage() {
  const flashcards = await getFlashcards()
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div>
          <h1 style={{fontSize:'2rem',fontWeight:'bold'}}>Flashcards</h1>
          <p style={{color:'#9ca3af',marginTop:'0.25rem'}}>{flashcards.length} flashcard(s)</p>
        </div>
        <a href="/admin/flashcards/new" style={{background:'#2563eb',color:'white',padding:'0.5rem 1rem',borderRadius:'0.5rem',textDecoration:'none'}}>
          + Nouvelle flashcard
        </a>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {flashcards.length === 0 && (
          <div style={{background:'#111827',borderRadius:'1rem',padding:'2rem',textAlign:'center',color:'#9ca3af'}}>
            Aucune flashcard pour l&apos;instant.
          </div>
        )}
        {flashcards.map((card: any) => (
          <div key={card.id} style={{background:'#111827',borderRadius:'1rem',padding:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.front_text}</p>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginTop:'0.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {card.sections?.chapters?.courses?.subjects?.name} &rsaquo; {card.sections?.title}
              </p>
            </div>
            <a href={`/admin/flashcards/${card.id}/edit`} style={{color:'#60a5fa',fontSize:'0.875rem',textDecoration:'none',flexShrink:0}}>
              Modifier
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
