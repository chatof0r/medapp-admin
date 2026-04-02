/**
 * POST /api/generate-sections
 *
 * Reçoit un chapitre + texte (collé ou extrait de PDF),
 * demande à Claude d'identifier les sections + générer leurs blocs,
 * crée les sections dans Supabase et retourne le résultat.
 *
 * FormData attendu :
 *   - chapter_id : string
 *   - text       : string (texte collé, prioritaire sur le PDF)
 *   - pdf        : File  (optionnel si text est fourni)
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf-extract'
import { generateSectionsWithBlocks } from '@/lib/claude-generate'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chapterId = formData.get('chapter_id') as string | null
    const pastedText = formData.get('text') as string | null
    const pdfFile = formData.get('pdf') as File | null

    if (!chapterId) {
      return NextResponse.json({ error: 'chapter_id est obligatoire.' }, { status: 400 })
    }

    // ── Étape 1 : obtenir le texte ─────────────────────────────────────────────
    let courseText = ''

    if (pastedText && pastedText.trim().length > 10) {
      courseText = pastedText.trim()
    } else if (pdfFile) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer())
      courseText = await extractTextFromPDF(buffer)
    } else {
      return NextResponse.json(
        { error: 'Fournis soit du texte collé, soit un fichier PDF.' },
        { status: 400 }
      )
    }

    // ── Étape 2 : génération Claude ────────────────────────────────────────────
    const generatedSections = await generateSectionsWithBlocks(courseText)

    if (!generatedSections.length) {
      return NextResponse.json({ error: 'Claude n\'a retourné aucune section.' }, { status: 500 })
    }

    // ── Étape 3 : calcul de l'ordre de départ ──────────────────────────────────
    const { data: existing } = await supabase
      .from('sections')
      .select('order')
      .eq('chapter_id', chapterId)
      .order('order', { ascending: false })
      .limit(1)

    const startOrder = (existing?.[0]?.order ?? 0) + 1

    // ── Étape 4 : insertion des sections en base ───────────────────────────────
    const rows = generatedSections.map((s, i) => ({
      title:          s.sectionTitle,
      chapter_id:     Number(chapterId),
      order:          startOrder + i,
      status:         'draft',
      is_free:        false,
      content_blocks: s.blocks,
    }))

    const { data: inserted, error: dbError } = await supabase
      .from('sections')
      .insert(rows)
      .select()

    if (dbError) {
      return NextResponse.json({ error: `Supabase : ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success:      true,
      sectionCount: inserted?.length ?? rows.length,
      sections:     generatedSections.map((s, i) => ({
        ...s,
        id:    inserted?.[i]?.id,
        order: startOrder + i,
      })),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[/api/generate-sections]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
