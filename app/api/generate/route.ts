/**
 * POST /api/generate
 * Orchestration complète : PDF → texte → Claude → Supabase
 *
 * Body : FormData
 *   - pdf        : File (le PDF uploadé)
 *   - section_id : string (l'id de la section cible)
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf-extract'
import { generateContentBlocks } from '@/lib/claude-generate'
import { supabase } from '@/lib/supabase'

// Assure l'exécution en Node.js (pdf-parse est incompatible avec Edge Runtime)
export const runtime = 'nodejs'

// Durée max sur Vercel (secondes) — Claude Opus peut prendre du temps sur un long PDF
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null
    const sectionId = formData.get('section_id') as string | null

    if (!file || !sectionId) {
      return NextResponse.json(
        { error: 'Les champs "pdf" et "section_id" sont obligatoires.' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Le fichier doit être un PDF.' },
        { status: 400 }
      )
    }

    // ── Étape 1 : Extraction du texte ─────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    const courseText = await extractTextFromPDF(buffer)

    // ── Étape 2 : Génération avec Claude ──────────────────────────────────────
    const blocks = await generateContentBlocks(courseText)

    // ── Étape 3 : Sauvegarde dans Supabase ────────────────────────────────────
    const { error: dbError } = await supabase
      .from('sections')
      .update({ content_blocks: blocks })
      .eq('id', sectionId)

    if (dbError) {
      return NextResponse.json(
        { error: `Erreur Supabase : ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sectionId,
      blockCount: blocks.length,
      blocks,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[/api/generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
