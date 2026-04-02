/**
 * lib/pdf-extract.ts
 * Extraction du texte brut depuis un buffer PDF côté serveur (Node.js uniquement).
 */

import pdfParse from 'pdf-parse/node'

/** Taille maximale du texte envoyé à Claude (≈ 150 000 tokens). */
const MAX_TEXT_LENGTH = 200_000

/**
 * Extrait le texte brut d'un buffer PDF.
 * @param buffer — contenu binaire du fichier PDF
 * @returns le texte nettoyé, tronqué si trop long
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  const text = data.text?.trim() ?? ''

  if (!text) {
    throw new Error(
      'Aucun texte extractible dans ce PDF. Vérifiez que le PDF n\'est pas une image scannée.'
    )
  }

  if (text.length > MAX_TEXT_LENGTH) {
    console.warn(`PDF tronqué : ${text.length} → ${MAX_TEXT_LENGTH} caractères`)
    return text.slice(0, MAX_TEXT_LENGTH)
  }

  return text
}
