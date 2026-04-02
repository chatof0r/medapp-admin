'use client'

/**
 * Page hiérarchie de contenu.
 * Navigation : Niveaux → Matières → Cours → Chapitres → Sections
 * Toutes les données passent par lib/content.ts (zéro appel Supabase ici).
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getLevelStats,
  getSubjectsByLevel,
  getCoursesBySubject,
  getChaptersByCourse,
  getSectionsByChapter,
  deleteSubject,
  deleteCourse,
  deleteChapter,
  deleteSection,
  type Subject,
  type Course,
  type Chapter,
  type Section,
  type LevelStats,
} from '@/lib/content'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const LEVELS = [
  { id: 'lycee', label: 'Lycée' },
  { id: 'pass',  label: 'PASS'  },
  { id: 'p2',    label: 'P2'    },
  { id: 'd1',    label: 'D1'    },
] as const

type LevelId = typeof LEVELS[number]['id']

const C = {
  bg:           '#ffffff',
  bgAlt:        '#f4f3ef',
  textPrimary:  '#1a1a18',
  textSecond:   '#5f5e5a',
  textTert:     '#888780',
  border:       'rgba(0,0,0,0.12)',
  borderStrong: 'rgba(0,0,0,0.22)',
  blue:         '#378ADD',
  blueLight:    '#e6f1fb',
  blueDark:     '#0c447c',
  green:        '#27500a',
  greenLight:   '#eaf3de',
  red:          '#791f1f',
  redLight:     '#fcebeb',
}

const TOAST_DURATION_MS = 3500

// ─── TYPES INTERNES ───────────────────────────────────────────────────────────

type EditMode = 'subjects' | 'courses' | 'chapters' | 'sections' | null

interface DeleteTarget {
  id:   string
  name: string
  type: 'subject' | 'course' | 'chapter' | 'section'
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

interface ListItem {
  id:      string
  name:    string
  status?: string
  isFree?: boolean
}

// ─── COMPOSANTS ───────────────────────────────────────────────────────────────

function Breadcrumb({
  selectedLevel,
  selectedSubject,
  selectedCourse,
  selectedChapter,
  onReset,
}: {
  selectedLevel:   LevelId | null
  selectedSubject: Subject | null
  selectedCourse:  Course  | null
  selectedChapter: Chapter | null
  onReset: (to: 'root' | 'level' | 'subject' | 'course') => void
}) {
  const crumbStyle = (clickable: boolean): React.CSSProperties => ({
    fontSize:   '12px',
    color:      clickable ? C.blue : C.textTert,
    cursor:     clickable ? 'pointer' : 'default',
    fontWeight: clickable ? 500 : 400,
    textDecoration: 'none',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <span style={crumbStyle(!!selectedLevel)} onClick={() => selectedLevel && onReset('root')}>
        Niveaux
      </span>
      {selectedLevel && (
        <>
          <span style={{ color: C.textTert, fontSize: '12px' }}>›</span>
          <span
            style={crumbStyle(!!selectedSubject)}
            onClick={() => selectedSubject && onReset('level')}
          >
            {LEVELS.find(l => l.id === selectedLevel)?.label}
          </span>
        </>
      )}
      {selectedSubject && (
        <>
          <span style={{ color: C.textTert, fontSize: '12px' }}>›</span>
          <span
            style={crumbStyle(!!selectedCourse)}
            onClick={() => selectedCourse && onReset('subject')}
          >
            {selectedSubject.name}
          </span>
        </>
      )}
      {selectedCourse && (
        <>
          <span style={{ color: C.textTert, fontSize: '12px' }}>›</span>
          <span
            style={crumbStyle(!!selectedChapter)}
            onClick={() => selectedChapter && onReset('course')}
          >
            {selectedCourse.title}
          </span>
        </>
      )}
      {selectedChapter && (
        <>
          <span style={{ color: C.textTert, fontSize: '12px' }}>›</span>
          <span style={crumbStyle(false)}>{selectedChapter.title}</span>
        </>
      )}
    </div>
  )
}

function LevelCards({
  stats,
  selectedLevel,
  onLevelClick,
}: {
  stats:         Record<string, LevelStats>
  selectedLevel: LevelId | null
  onLevelClick:  (level: LevelId) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
      {LEVELS.map(level => {
        const s        = stats[level.id] ?? { subjectCount: 0, courseCount: 0, chapterCount: 0 }
        const isActive = selectedLevel === level.id
        const isDimmed = selectedLevel !== null && !isActive

        return (
          <div
            key={level.id}
            onClick={() => onLevelClick(level.id)}
            style={{
              background:   isActive ? C.bgAlt : C.bg,
              border:       `0.5px solid ${isActive ? C.borderStrong : C.border}`,
              borderRadius: '10px',
              padding:      isActive ? '10px 14px' : '16px 14px',
              cursor:       'pointer',
              opacity:      isDimmed ? 0.5 : 1,
              transition:   'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: C.textPrimary }}>{level.label}</span>
              {isActive && <span style={{ fontSize: '10px', color: C.textTert }}>▲</span>}
            </div>
            {!isActive && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '11px', color: C.textTert }}>
                  <span style={{ fontWeight: 500, color: C.textPrimary }}>{s.subjectCount}</span> matière{s.subjectCount !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '11px', color: C.textTert }}>
                  <span style={{ fontWeight: 500, color: C.textPrimary }}>{s.courseCount}</span> cours
                </div>
                <div style={{ fontSize: '11px', color: C.textTert }}>
                  <span style={{ fontWeight: 500, color: C.textPrimary }}>{s.chapterCount}</span> chapitre{s.chapterCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ContentList({
  title,
  items,
  isEditMode,
  onToggleEdit,
  onItemClick,
  onEdit,
  onDelete,
  onAdd,
  selectedId,
  showBadges = false,
  isLeaf = false,
}: {
  title:        string
  items:        ListItem[]
  isEditMode:   boolean
  onToggleEdit: () => void
  onItemClick:  (id: string) => void
  onEdit:       (id: string) => void
  onDelete:     (id: string) => void
  onAdd:        () => void
  selectedId?:  string
  showBadges?:  boolean
  isLeaf?:      boolean
}) {
  return (
    <div style={{
      marginTop:    '16px',
      background:   C.bg,
      border:       `0.5px solid ${C.border}`,
      borderRadius: '12px',
      overflow:     'hidden',
    }}>
      <div style={{
        padding:        '13px 16px',
        borderBottom:   `0.5px solid ${C.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: C.textPrimary }}>{title}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onAdd}
            style={{
              fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
              background: C.blueLight, color: C.blueDark,
              border: `0.5px solid rgba(55,138,221,0.3)`, fontWeight: 500,
            }}
          >
            + Ajouter
          </button>
          <button
            onClick={onToggleEdit}
            style={{
              fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
              background: isEditMode ? C.greenLight : C.bgAlt,
              color:      isEditMode ? C.green       : C.textSecond,
              border:     `0.5px solid ${C.border}`, fontWeight: 500,
            }}
          >
            {isEditMode ? '✓ Terminer' : '✎ Modifier'}
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: C.textTert, fontSize: '13px' }}>
          Aucun élément pour l&apos;instant.
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={item.id}
          onClick={() => { if (!isEditMode && !isLeaf) onItemClick(item.id) }}
          style={{
            display:      'flex',
            alignItems:   'center',
            padding:      '11px 16px',
            borderBottom: index < items.length - 1 ? `0.5px solid ${C.border}` : 'none',
            cursor:       isEditMode || isLeaf ? 'default' : 'pointer',
            background:   selectedId === item.id ? C.bgAlt : C.bg,
            transition:   'background 0.1s',
            gap:          '8px',
          }}
        >
          {selectedId === item.id && !isEditMode && (
            <div style={{ width: '3px', height: '16px', background: C.blue, borderRadius: '2px', flexShrink: 0 }} />
          )}

          <span style={{ flex: 1, fontSize: '13px', color: C.textPrimary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>

          {showBadges && item.status && (
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '10px', flexShrink: 0, fontWeight: 500,
              background: item.status === 'published' ? C.greenLight : C.bgAlt,
              color:      item.status === 'published' ? C.green       : C.textTert,
            }}>
              {item.status === 'published' ? 'Publié' : 'Brouillon'}
            </span>
          )}

          {showBadges && item.isFree && (
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '10px', flexShrink: 0, fontWeight: 500,
              background: C.blueLight, color: C.blueDark,
            }}>
              Gratuit
            </span>
          )}

          {isEditMode ? (
            <div style={{ display: 'flex', gap: '4px', marginLeft: '4px', flexShrink: 0 }}>
              <button
                onClick={e => { e.stopPropagation(); onEdit(item.id) }}
                title="Modifier"
                style={{
                  background: 'none', border: `0.5px solid ${C.border}`, cursor: 'pointer',
                  color: C.blue, padding: '4px 8px', borderRadius: '6px', fontSize: '13px',
                }}
              >
                ✎
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(item.id) }}
                title="Supprimer"
                style={{
                  background: 'none', border: `0.5px solid rgba(121,31,31,0.2)`, cursor: 'pointer',
                  color: C.red, padding: '4px 8px', borderRadius: '6px', fontSize: '13px',
                }}
              >
                ✕
              </button>
            </div>
          ) : !isLeaf ? (
            <span style={{ color: C.textTert, fontSize: '12px', flexShrink: 0 }}>›</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function DeleteModal({
  target,
  loading,
  onConfirm,
  onCancel,
}: {
  target:    DeleteTarget
  loading:   boolean
  onConfirm: () => void
  onCancel:  () => void
}) {
  const typeLabel: Record<DeleteTarget['type'], string> = {
    subject: 'cette matière',
    course:  'ce cours',
    chapter: 'ce chapitre',
    section: 'cette section',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: C.bg, borderRadius: '14px', padding: '28px',
        width: '380px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: C.textPrimary, marginBottom: '10px' }}>
          Confirmer la suppression
        </h2>
        <p style={{ fontSize: '13px', color: C.textSecond, lineHeight: 1.6, marginBottom: '24px' }}>
          Supprimer <strong>{target.name}</strong> ? Cette action est définitive.
          Si {typeLabel[target.type]} contient des éléments enfants, la suppression sera bloquée.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              background: C.bgAlt, border: `0.5px solid ${C.border}`, color: C.textSecond,
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              background: C.redLight, border: `0.5px solid rgba(121,31,31,0.3)`,
              color: C.red, fontWeight: 500,
            }}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, type }: ToastState) {
  return (
    <div style={{
      position:     'fixed',
      bottom:       '24px',
      right:        '24px',
      padding:      '12px 18px',
      borderRadius: '10px',
      fontSize:     '13px',
      fontWeight:   500,
      background:   type === 'success' ? C.greenLight : C.redLight,
      color:        type === 'success' ? C.green       : C.red,
      border:       `0.5px solid ${type === 'success' ? 'rgba(39,80,10,0.25)' : 'rgba(121,31,31,0.25)'}`,
      boxShadow:    '0 4px 16px rgba(0,0,0,0.1)',
      zIndex:       100,
      maxWidth:     '360px',
    }}>
      {type === 'success' ? '✓ ' : '⚠ '}{message}
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function HierarchyPage() {
  const router = useRouter()

  // État de navigation
  const [selectedLevel,   setSelectedLevel]   = useState<LevelId | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedCourse,  setSelectedCourse]  = useState<Course  | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

  // Données
  const [levelStats, setLevelStats] = useState<Record<string, LevelStats>>({})
  const [subjects,   setSubjects]   = useState<Subject[]>([])
  const [courses,    setCourses]    = useState<Course[]>([])
  const [chapters,   setChapters]   = useState<Chapter[]>([])
  const [sections,   setSections]   = useState<Section[]>([])

  // État UI
  const [editMode,      setEditMode]      = useState<EditMode>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<DeleteTarget | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [toast,         setToast]         = useState<ToastState | null>(null)

  useEffect(() => { getLevelStats().then(setLevelStats) }, [])

  useEffect(() => {
    if (!selectedLevel) return
    getSubjectsByLevel(selectedLevel).then(setSubjects)
    setSelectedSubject(null)
    setCourses([])
    setSelectedCourse(null)
    setChapters([])
    setSelectedChapter(null)
    setSections([])
    setEditMode(null)
  }, [selectedLevel])

  useEffect(() => {
    if (!selectedSubject) return
    getCoursesBySubject(Number(selectedSubject.id)).then(setCourses)
    setSelectedCourse(null)
    setChapters([])
    setSelectedChapter(null)
    setSections([])
    setEditMode(null)
  }, [selectedSubject])

  useEffect(() => {
    if (!selectedCourse) return
    getChaptersByCourse(String(selectedCourse.id)).then(setChapters)
    setSelectedChapter(null)
    setSections([])
    setEditMode(null)
  }, [selectedCourse])

  useEffect(() => {
    if (!selectedChapter) return
    getSectionsByChapter(String(selectedChapter.id)).then(setSections)
    setEditMode(null)
  }, [selectedChapter])

  function showToast(message: string, type: ToastState['type']) {
    setToast({ message, type })
    setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }

  function handleLevelClick(level: LevelId) {
    if (selectedLevel === level) {
      setSelectedLevel(null)
      setSelectedSubject(null)
      setSubjects([])
      setCourses([])
      setChapters([])
      setSections([])
      setEditMode(null)
    } else {
      setSelectedLevel(level)
    }
  }

  function resetTo(to: 'root' | 'level' | 'subject' | 'course') {
    if (to === 'root') {
      setSelectedLevel(null)
      setSelectedSubject(null)
      setSelectedCourse(null)
      setSelectedChapter(null)
      setSubjects([])
      setCourses([])
      setChapters([])
      setSections([])
    } else if (to === 'level') {
      setSelectedSubject(null)
      setSelectedCourse(null)
      setSelectedChapter(null)
      setCourses([])
      setChapters([])
      setSections([])
    } else if (to === 'subject') {
      setSelectedCourse(null)
      setSelectedChapter(null)
      setChapters([])
      setSections([])
    } else if (to === 'course') {
      setSelectedChapter(null)
      setSections([])
    }
    setEditMode(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setLoadingDelete(true)

    let result: { error: string | null }

    if (deleteTarget.type === 'subject') {
      result = await deleteSubject(deleteTarget.id)
      if (!result.error) {
        setSubjects(prev => prev.filter(s => String(s.id) !== deleteTarget.id))
        if (String(selectedSubject?.id) === deleteTarget.id) resetTo('level')
      }
    } else if (deleteTarget.type === 'course') {
      result = await deleteCourse(deleteTarget.id)
      if (!result.error) {
        setCourses(prev => prev.filter(c => String(c.id) !== deleteTarget.id))
        if (String(selectedCourse?.id) === deleteTarget.id) resetTo('subject')
      }
    } else if (deleteTarget.type === 'chapter') {
      result = await deleteChapter(deleteTarget.id)
      if (!result.error) {
        setChapters(prev => prev.filter(ch => String(ch.id) !== deleteTarget.id))
        if (String(selectedChapter?.id) === deleteTarget.id) resetTo('course')
      }
    } else {
      result = await deleteSection(deleteTarget.id)
      if (!result.error) {
        setSections(prev => prev.filter(s => String(s.id) !== deleteTarget.id))
      }
    }

    setLoadingDelete(false)
    setDeleteTarget(null)

    if (result!.error) {
      showToast(result!.error, 'error')
    } else {
      showToast('Supprimé avec succès.', 'success')
      getLevelStats().then(setLevelStats)
    }
  }

  // ─── RENDU ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: C.textPrimary }}>
          Hiérarchie de contenu
        </h1>
        <p style={{ fontSize: '12px', color: C.textTert, marginTop: '4px' }}>
          Naviguez par niveau pour gérer matières, cours, chapitres et sections.
        </p>
      </div>

      <Breadcrumb
        selectedLevel={selectedLevel}
        selectedSubject={selectedSubject}
        selectedCourse={selectedCourse}
        selectedChapter={selectedChapter}
        onReset={resetTo}
      />

      <LevelCards
        stats={levelStats}
        selectedLevel={selectedLevel}
        onLevelClick={handleLevelClick}
      />

      {/* Liste des matières */}
      {selectedLevel && (
        <ContentList
          title={`${LEVELS.find(l => l.id === selectedLevel)?.label} — Matières`}
          items={subjects.map(s => ({ id: String(s.id), name: s.name }))}
          isEditMode={editMode === 'subjects'}
          onToggleEdit={() => setEditMode(editMode === 'subjects' ? null : 'subjects')}
          onItemClick={id => setSelectedSubject(subjects.find(s => String(s.id) === id) ?? null)}
          onEdit={id => router.push(`/admin/subjects/${id}/edit`)}
          onDelete={id => {
            const s = subjects.find(s => String(s.id) === id)
            if (s) setDeleteTarget({ id: String(s.id), name: s.name, type: 'subject' })
          }}
          onAdd={() => router.push('/admin/subjects/new')}
          selectedId={selectedSubject ? String(selectedSubject.id) : undefined}
        />
      )}

      {/* Liste des cours */}
      {selectedSubject && (
        <ContentList
          title={`${selectedSubject.name} — Cours`}
          items={courses.map(c => ({ id: String(c.id), name: c.title }))}
          isEditMode={editMode === 'courses'}
          onToggleEdit={() => setEditMode(editMode === 'courses' ? null : 'courses')}
          onItemClick={id => setSelectedCourse(courses.find(c => String(c.id) === id) ?? null)}
          onEdit={id => router.push(`/admin/courses/${id}/edit`)}
          onDelete={id => {
            const c = courses.find(c => String(c.id) === id)
            if (c) setDeleteTarget({ id: String(c.id), name: c.title, type: 'course' })
          }}
          onAdd={() => router.push(`/admin/courses/new?subject_id=${selectedSubject.id}`)}
          selectedId={selectedCourse ? String(selectedCourse.id) : undefined}
        />
      )}

      {/* Liste des chapitres */}
      {selectedCourse && (
        <ContentList
          title={`${selectedCourse.title} — Chapitres`}
          items={chapters.map(ch => ({ id: String(ch.id), name: ch.title }))}
          isEditMode={editMode === 'chapters'}
          onToggleEdit={() => setEditMode(editMode === 'chapters' ? null : 'chapters')}
          onItemClick={id => setSelectedChapter(chapters.find(ch => String(ch.id) === id) ?? null)}
          onEdit={id => router.push(`/admin/chapters/${id}/edit`)}
          onDelete={id => {
            const ch = chapters.find(ch => String(ch.id) === id)
            if (ch) setDeleteTarget({ id: String(ch.id), name: ch.title, type: 'chapter' })
          }}
          onAdd={() => router.push(`/admin/chapters/new?course_id=${selectedCourse.id}`)}
          selectedId={selectedChapter ? String(selectedChapter.id) : undefined}
        />
      )}

      {/* Liste des sections */}
      {selectedChapter && (
        <ContentList
          title={`${selectedChapter.title} — Sections`}
          items={sections.map(s => ({
            id:     String(s.id),
            name:   s.title,
            status: s.status,
            isFree: s.is_free,
          }))}
          isEditMode={editMode === 'sections'}
          onToggleEdit={() => setEditMode(editMode === 'sections' ? null : 'sections')}
          onItemClick={() => {}}
          onEdit={id => router.push(`/admin/sections/${id}/edit`)}
          onDelete={id => {
            const s = sections.find(s => String(s.id) === id)
            if (s) setDeleteTarget({ id: String(s.id), name: s.title, type: 'section' })
          }}
          onAdd={() => router.push(`/admin/sections/new?chapter_id=${selectedChapter.id}`)}
          selectedId={undefined}
          showBadges
          isLeaf
        />
      )}

      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          loading={loadingDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
