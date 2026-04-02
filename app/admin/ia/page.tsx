'use client'

/**
 * Page Génération IA — /admin/ia
 *
 * Flux : sélectionner un chapitre → coller texte OU uploader PDF
 *        → Claude génère les sections + leurs blocs
 *        → sections créées dans Supabase
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getSubjectsByLevel,
  getCoursesBySubject,
  getChaptersByCourse,
  type Subject,
  type Course,
  type Chapter,
} from '@/lib/content'
import type { ContentBlock, GeneratedSection } from '@/lib/claude-generate'

const LEVELS = [
  { id: 'lycee', label: 'Lycée' },
  { id: 'pass',  label: 'PASS'  },
  { id: 'p2',    label: 'P2'    },
  { id: 'd1',    label: 'D1'    },
] as const
type LevelId = typeof LEVELS[number]['id']

// ─── PALETTE ─────────────────────────────────────────────────────────────────

const C = {
  bg:          '#f4f3ef',
  white:       '#ffffff',
  textPrimary: '#1a1a18',
  textSecond:  '#5f5e5a',
  textTert:    '#888780',
  border:      'rgba(0,0,0,0.12)',
  borderStr:   'rgba(0,0,0,0.22)',
  blue:        '#378ADD',
  blueLight:   '#e6f1fb',
  blueDark:    '#0c447c',
  green:       '#27500a',
  greenLight:  '#eaf3de',
  red:         '#791f1f',
  redLight:    '#fcebeb',
  orange:      '#92400e',
  orangeLight: '#fff7ed',
  orangeBorder:'rgba(146,64,14,0.25)',
}

const BLOCK_PALETTE = [
  { bg: '#e6f1fb', text: '#0c447c', border: 'rgba(55,138,221,0.25)'   },
  { bg: '#f3e8fb', text: '#5b0c7c', border: 'rgba(147,55,221,0.25)'   },
  { bg: '#eaf3de', text: '#27500a', border: 'rgba(59,130,46,0.25)'    },
  { bg: '#e0f5f3', text: '#065f52', border: 'rgba(20,184,166,0.25)'   },
  { bg: '#fce7f3', text: '#831843', border: 'rgba(236,72,153,0.25)'   },
  { bg: '#fff7ed', text: '#92400e', border: 'rgba(245,158,11,0.25)'   },
  { bg: '#eef2ff', text: '#1e1b4b', border: 'rgba(99,102,241,0.25)'   },
]

const TYPE_LABELS: Record<string, string> = {
  introduction:      'Introduction',
  anatomy:           'Anatomie',
  innervation:       'Innervation',
  function:          'Fonction',
  key_points:        'Points clés',
  recap_table:       'Tableau récap',
  image_placeholder: 'Schéma',
}

// ─── SOUS-COMPOSANTS ─────────────────────────────────────────────────────────

function BlockCard({ block, index }: { block: ContentBlock; index: number }) {
  const isImage = block.type === 'image_placeholder'
  const palette = isImage
    ? { bg: C.orangeLight, text: C.orange, border: C.orangeBorder }
    : BLOCK_PALETTE[block.colorIndex % 7]

  return (
    <div style={{
      background: C.white, border: `0.5px solid ${C.border}`,
      borderRadius: '10px', overflow: 'hidden',
    }}>
      <div style={{
        background: palette.bg, borderBottom: `0.5px solid ${palette.border}`,
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: palette.text, background: palette.border, padding: '1px 5px', borderRadius: '5px' }}>
          #{index + 1}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: palette.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isImage && '📐 '}{TYPE_LABELS[block.type] ?? block.type}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block.title}
        </span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {isImage ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>📐</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: C.orange, marginBottom: '3px' }}>
                Position : {(block as any).position ?? 'full'}
              </div>
              <div style={{ fontSize: '12px', color: C.textSecond, lineHeight: 1.5 }}>
                {(block as any).description}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: C.textPrimary, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
            {(block as any).content}
          </p>
        )}
      </div>
    </div>
  )
}

function SectionPreview({ section, index }: { section: GeneratedSection & { id?: string }; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const textBlocks  = section.blocks.filter(b => b.type !== 'image_placeholder').length
  const imageBlocks = section.blocks.length - textBlocks

  return (
    <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header cliquable */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '12px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: open ? C.bg : C.white,
          borderBottom: open ? `0.5px solid ${C.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: C.blueLight, color: C.blueDark,
            fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
          }}>
            Section {index + 1}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: C.textPrimary }}>
            {section.sectionTitle}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: C.textTert }}>
            {textBlocks} bloc{textBlocks > 1 ? 's' : ''} · <span style={{ color: C.orange }}>{imageBlocks} schéma{imageBlocks > 1 ? 's' : ''}</span>
          </span>
          {section.id && (
            <span style={{ fontSize: '10px', color: C.green, fontWeight: 600, background: C.greenLight, padding: '1px 6px', borderRadius: '4px' }}>
              ✓ créée
            </span>
          )}
          <span style={{ color: C.textTert, fontSize: '12px' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {section.blocks.map((block, i) => (
            <BlockCard key={block.id} block={block} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────

type InputMode = 'text' | 'pdf'

export default function IAPage() {
  // Sélecteurs en cascade
  const [selectedLevel,   setSelectedLevel]   = useState<LevelId | ''>('')
  const [subjects,        setSubjects]        = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [courses,         setCourses]         = useState<Course[]>([])
  const [selectedCourse,  setSelectedCourse]  = useState<Course | null>(null)
  const [chapters,        setChapters]        = useState<Chapter[]>([])
  const [chapterId,       setChapterId]       = useState('')

  // Input
  const [inputMode,  setInputMode]  = useState<InputMode>('text')
  const [pastedText, setPastedText] = useState('')
  const [pdfFile,    setPdfFile]    = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Résultats
  const [sections,   setSections]   = useState<(GeneratedSection & { id?: string })[]>([])

  // UI
  const [generating, setGenerating] = useState(false)
  const [step,       setStep]       = useState('')
  const [error,      setError]      = useState('')
  const [done,       setDone]       = useState(false)

  // Niveau → matières
  useEffect(() => {
    if (!selectedLevel) { setSubjects([]); setSelectedSubject(null); setCourses([]); setSelectedCourse(null); setChapters([]); setChapterId(''); return }
    getSubjectsByLevel(selectedLevel).then(setSubjects)
    setSelectedSubject(null); setCourses([]); setSelectedCourse(null); setChapters([]); setChapterId('')
  }, [selectedLevel])

  // Matière → cours
  useEffect(() => {
    if (!selectedSubject) { setCourses([]); setSelectedCourse(null); setChapters([]); setChapterId(''); return }
    getCoursesBySubject(Number(selectedSubject.id)).then(setCourses)
    setSelectedCourse(null); setChapters([]); setChapterId('')
  }, [selectedSubject])

  // Cours → chapitres
  useEffect(() => {
    if (!selectedCourse) { setChapters([]); setChapterId(''); return }
    getChaptersByCourse(String(selectedCourse.id)).then(setChapters)
    setChapterId('')
  }, [selectedCourse])

  const hasInput = inputMode === 'text'
    ? pastedText.trim().length > 20
    : pdfFile !== null

  const canGenerate = !!chapterId && hasInput && !generating

  async function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true)
    setError('')
    setDone(false)
    setSections([])

    try {
      setStep('Préparation du contenu...')
      const formData = new FormData()
      formData.append('chapter_id', chapterId)
      if (inputMode === 'text') {
        formData.append('text', pastedText)
      } else if (pdfFile) {
        formData.append('pdf', pdfFile)
        setStep('Extraction du texte PDF...')
      }

      setStep('Génération par Claude Opus (30–90 s selon la longueur du cours)...')
      const res = await fetch('/api/generate-sections', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')

      setSections(json.sections)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGenerating(false)
      setStep('')
    }
  }

  const totalBlocks  = sections.reduce((n, s) => n + s.blocks.length, 0)
  const totalImages  = sections.reduce((n, s) => n + s.blocks.filter(b => b.type === 'image_placeholder').length, 0)

  // ── RENDU ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Titre */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: C.textPrimary }}>Génération IA</h1>
        <p style={{ fontSize: '12px', color: C.textTert, marginTop: '4px' }}>
          Sélectionne un chapitre, colle le texte du cours ou uploade le PDF — Claude génère les sections et leur contenu.
        </p>
      </div>

      {/* Panneau de configuration */}
      <div style={{
        background: C.white, border: `0.5px solid ${C.border}`,
        borderRadius: '14px', padding: '20px', marginBottom: '20px',
      }}>

        {/* Sélecteurs en cascade */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: C.textSecond, marginBottom: '8px' }}>
            Chapitre cible
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>

            {/* Niveau */}
            <div>
              <div style={{ fontSize: '11px', color: C.textTert, marginBottom: '4px' }}>Niveau</div>
              <select
                value={selectedLevel}
                onChange={e => { setSelectedLevel(e.target.value as LevelId); setError(''); setDone(false); setSections([]) }}
                style={{ width: '100%', background: C.bg, color: selectedLevel ? C.textPrimary : C.textTert, border: `0.5px solid ${C.borderStr}`, borderRadius: '8px', padding: '7px 8px', fontSize: '12px' }}
              >
                <option value="">— Niveau —</option>
                {LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>

            {/* Matière */}
            <div>
              <div style={{ fontSize: '11px', color: C.textTert, marginBottom: '4px' }}>Matière</div>
              <select
                value={selectedSubject ? String(selectedSubject.id) : ''}
                onChange={e => { const s = subjects.find(s => String(s.id) === e.target.value) ?? null; setSelectedSubject(s); setDone(false); setSections([]) }}
                disabled={subjects.length === 0}
                style={{ width: '100%', background: C.bg, color: selectedSubject ? C.textPrimary : C.textTert, border: `0.5px solid ${C.borderStr}`, borderRadius: '8px', padding: '7px 8px', fontSize: '12px', opacity: subjects.length === 0 ? 0.4 : 1 }}
              >
                <option value="">— Matière —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Cours */}
            <div>
              <div style={{ fontSize: '11px', color: C.textTert, marginBottom: '4px' }}>Cours</div>
              <select
                value={selectedCourse ? String(selectedCourse.id) : ''}
                onChange={e => { const c = courses.find(c => String(c.id) === e.target.value) ?? null; setSelectedCourse(c); setDone(false); setSections([]) }}
                disabled={courses.length === 0}
                style={{ width: '100%', background: C.bg, color: selectedCourse ? C.textPrimary : C.textTert, border: `0.5px solid ${C.borderStr}`, borderRadius: '8px', padding: '7px 8px', fontSize: '12px', opacity: courses.length === 0 ? 0.4 : 1 }}
              >
                <option value="">— Cours —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            {/* Chapitre */}
            <div>
              <div style={{ fontSize: '11px', color: C.textTert, marginBottom: '4px' }}>Chapitre</div>
              <select
                value={chapterId}
                onChange={e => { setChapterId(e.target.value); setError(''); setDone(false); setSections([]) }}
                disabled={chapters.length === 0}
                style={{ width: '100%', background: C.bg, color: chapterId ? C.textPrimary : C.textTert, border: `0.5px solid ${chapterId ? C.blue : C.borderStr}`, borderRadius: '8px', padding: '7px 8px', fontSize: '12px', opacity: chapters.length === 0 ? 0.4 : 1 }}
              >
                <option value="">— Chapitre —</option>
                {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
              </select>
            </div>
          </div>

          {/* Breadcrumb de confirmation */}
          {chapterId && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: C.green, fontWeight: 500 }}>
              ✓ {LEVELS.find(l => l.id === selectedLevel)?.label} › {selectedSubject?.name} › {selectedCourse?.title} › {chapters.find(ch => String(ch.id) === chapterId)?.title}
            </div>
          )}
        </div>

        {/* Sélecteur de mode d'input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: C.textSecond, marginBottom: '6px' }}>
            Source du cours
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['text', 'pdf'] as InputMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  padding: '6px 14px', borderRadius: '7px', fontSize: '12px',
                  fontWeight: inputMode === mode ? 600 : 400,
                  cursor: 'pointer', border: `0.5px solid ${inputMode === mode ? C.blue : C.border}`,
                  background: inputMode === mode ? C.blueLight : C.bg,
                  color: inputMode === mode ? C.blueDark : C.textSecond,
                  transition: 'all 0.12s',
                }}
              >
                {mode === 'text' ? '📋 Coller du texte' : '📄 Uploader un PDF'}
              </button>
            ))}
          </div>
        </div>

        {/* Zone d'input selon le mode */}
        {inputMode === 'text' ? (
          <textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="Colle ici le texte du cours du professeur..."
            rows={8}
            style={{
              width: '100%', background: C.bg, color: C.textPrimary,
              border: `0.5px solid ${C.borderStr}`, borderRadius: '8px',
              padding: '10px 12px', fontSize: '13px', lineHeight: 1.6,
              resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: pdfFile ? C.greenLight : C.bg,
              border: `0.5px dashed ${pdfFile ? 'rgba(39,80,10,0.4)' : C.borderStr}`,
              borderRadius: '8px', padding: '24px',
              cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{pdfFile ? '📄' : '⬆️'}</div>
            <div style={{ fontSize: '13px', color: pdfFile ? C.green : C.textSecond, fontWeight: pdfFile ? 600 : 400 }}>
              {pdfFile ? pdfFile.name : 'Cliquer pour uploader un PDF'}
            </div>
            {pdfFile && (
              <div style={{ fontSize: '11px', color: C.textTert, marginTop: '4px' }}>
                {(pdfFile.size / 1024 / 1024).toFixed(1)} Mo · <span
                  onClick={e => { e.stopPropagation(); setPdfFile(null) }}
                  style={{ color: C.red, cursor: 'pointer' }}
                >supprimer</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setPdfFile(f); setError('') } }}
            />
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ background: C.redLight, color: C.red, padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' }}>
            ⚠ {error}
          </div>
        )}

        {/* Bouton + étape */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              background: canGenerate ? C.blue : C.bg,
              color:      canGenerate ? 'white'  : C.textTert,
              padding: '9px 22px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600,
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {generating ? '⏳ Génération...' : '✦ Générer les sections'}
          </button>

          {generating && step && (
            <span style={{ fontSize: '12px', color: C.textTert, fontStyle: 'italic' }}>{step}</span>
          )}
        </div>
      </div>

      {/* Résultats */}
      {sections.length > 0 && (
        <>
          {/* Bandeau récap */}
          <div style={{
            background: done ? C.greenLight : C.blueLight,
            border: `0.5px solid ${done ? 'rgba(39,80,10,0.25)' : 'rgba(55,138,221,0.25)'}`,
            borderRadius: '10px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: done ? C.green : C.blueDark }}>
              {done ? '✓ ' : ''}{sections.length} section{sections.length > 1 ? 's' : ''} générée{sections.length > 1 ? 's' : ''} et sauvegardées dans Supabase
            </div>
            <span style={{ fontSize: '12px', color: done ? C.green : C.blueDark }}>
              {totalBlocks - totalImages} blocs · <span style={{ color: C.orange }}>{totalImages} schéma{totalImages > 1 ? 's' : ''}</span>
            </span>
          </div>

          {/* Section cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sections.map((section, i) => (
              <SectionPreview key={i} section={section} index={i} />
            ))}
          </div>
        </>
      )}

      {/* État vide */}
      {sections.length === 0 && !generating && (
        <div style={{
          background: C.white, border: `0.5px solid ${C.border}`,
          borderRadius: '14px', padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✦</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: C.textPrimary, marginBottom: '6px' }}>
            Prêt à générer
          </div>
          <div style={{ fontSize: '13px', color: C.textTert, maxWidth: '320px', margin: '0 auto' }}>
            Sélectionne un chapitre, colle le texte ou uploade le PDF, puis clique sur &quot;Générer les sections&quot;.
          </div>
        </div>
      )}
    </div>
  )
}
