import { supabase } from '@/lib/supabase'

async function getStats() {
  const [subjects, courses, chapters, sections, flashcards, sectionsPublished] =
    await Promise.all([
      supabase.from('subjects').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('chapters').select('*', { count: 'exact', head: true }),
      supabase.from('sections').select('*', { count: 'exact', head: true }),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }),
      supabase.from('sections').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ])

  return {
    subjects:          subjects.count          ?? 0,
    courses:           courses.count           ?? 0,
    chapters:          chapters.count          ?? 0,
    sections:          sections.count          ?? 0,
    flashcards:        flashcards.count        ?? 0,
    sectionsPublished: sectionsPublished.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Matières',           value: stats.subjects,   sub: 'subjects'   },
    { label: 'Cours',              value: stats.courses,    sub: 'courses'     },
    { label: 'Chapitres',          value: stats.chapters,   sub: 'chapters'    },
    { label: 'Sections',           value: stats.sections,   sub: 'sections'    },
    { label: 'Flashcards',         value: stats.flashcards, sub: 'flashcards'  },
    {
      label: 'Sections publiées',
      value: `${stats.sectionsPublished} / ${stats.sections}`,
      sub: null,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a18' }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: '#888780', marginTop: '4px' }}>Vue d&apos;ensemble du contenu MedApp</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: '#ffffff',
              border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a18' }}>{card.value}</span>
            <span style={{ fontSize: '13px', color: '#5f5e5a' }}>{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
