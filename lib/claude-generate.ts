/**
 * lib/claude-generate.ts
 * Appel à l'API Claude pour transformer un texte de cours en blocs JSON structurés.
 */

import Anthropic from '@anthropic-ai/sdk'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type BlockType =
  | 'introduction'
  | 'anatomy'
  | 'innervation'
  | 'function'
  | 'key_points'
  | 'recap_table'
  | 'image_placeholder'

export interface TextBlock {
  id: string
  type: Exclude<BlockType, 'image_placeholder'>
  title: string
  content: string
  colorIndex: number
}

export interface ImageBlock {
  id: string
  type: 'image_placeholder'
  title: string
  description: string
  position: 'full' | 'right' | 'left'
  colorIndex: number
}

export type ContentBlock = TextBlock | ImageBlock

// ─── PROMPT SYSTÈME ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert en anatomie médicale chargé de transformer des cours de professeurs en contenu pédagogique structuré pour une application mobile destinée aux étudiants P2/D1 en médecine.

## MISSION
Réécrire intégralement le cours fourni en blocs pédagogiques ordonnés. Le contenu doit être fidèle à 100% au cours du professeur (aucune information omise, aucune information inventée) tout en étant réécrit dans un style clair, structuré et pédagogique adapté à la lecture sur mobile.

## TON
Pédagogique et structuré. Ni familier, ni froid. Pas de "tu" ni de "vous". Phrases affirmatives, directes, comme un manuel de référence bien écrit. Niveau P2/D1.

## TERMINOLOGIE
Utiliser le français comme langue principale. Ajouter les termes latins entre parenthèses uniquement quand ils apportent une précision utile ou sont couramment utilisés en examen (ex : "tubercule supraglénoïdal (tuberculum supraglenoidale)").

## TYPES DE BLOCS À PRODUIRE
Identifier et structurer le contenu en blocs typés. Chaque bloc a obligatoirement un "title" et un "content".

Types disponibles :
- "introduction" : définition, présentation générale de la structure
- "anatomy" : description anatomique — origine, trajet, terminaison — une structure par bloc
- "innervation" : innervation et vascularisation
- "function" : rôles fonctionnels et mécaniques
- "key_points" : points clés et pièges d'examen — UNIQUEMENT si le professeur les mentionne explicitement
- "recap_table" : tableau récapitulatif en Markdown — UNIQUEMENT si le cours couvre plusieurs muscles ou structures comparables
- "image_placeholder" : schéma anatomique à fournir — insérer le plus possible, dès qu'une représentation visuelle aiderait la compréhension

## FORMAT DE SORTIE
Retourner UNIQUEMENT un tableau JSON valide. Aucun texte avant ou après. Aucun bloc de code Markdown. Juste le JSON brut.

Structure de chaque bloc :

Bloc texte :
{
  "id": "b1",
  "type": "introduction" | "anatomy" | "innervation" | "function" | "key_points" | "recap_table",
  "title": "Titre court et descriptif du bloc",
  "content": "Contenu réécrit, 4-5 phrases maximum par bloc. Pour recap_table : tableau en Markdown.",
  "colorIndex": 0
}

Bloc schéma :
{
  "id": "b2",
  "type": "image_placeholder",
  "title": "Titre du schéma",
  "description": "Description précise et détaillée du schéma anatomique attendu : angle de vue, structures à faire apparaître, légendes souhaitées",
  "position": "full" | "right" | "left",
  "colorIndex": 1
}

## RÈGLES
- colorIndex va de 0 à 6 en boucle, incrémenté à chaque nouveau bloc
- Les image_placeholder s'intercalent entre les blocs texte auxquels ils se rapportent — pas regroupés à la fin
- Un bloc "anatomy" par structure distincte (pas tout regroupé en un seul bloc)
- Le bloc "recap_table" se place toujours en dernier si présent
- Aucune information du cours original ne doit être omise
- Aucune information externe au cours ne doit être ajoutée, sauf pour les image_placeholder dont la description peut s'appuyer sur les connaissances anatomiques standard`

// ─── TYPES SECTIONS ───────────────────────────────────────────────────────────

export interface GeneratedSection {
  sectionTitle: string
  blocks: ContentBlock[]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

function makeClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ─── GÉNÉRATION BLOCS (ancienne feature, conservée) ───────────────────────────

/**
 * Envoie le texte du cours à Claude et retourne les blocs JSON générés.
 * @param courseText — texte brut extrait du PDF
 */
export async function generateContentBlocks(courseText: string): Promise<ContentBlock[]> {
  const client = makeClient()

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Voici le cours à transformer :\n\n${courseText}` }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const blocks = parseJSON<ContentBlock[]>(raw)
  if (!Array.isArray(blocks)) throw new Error('La réponse de Claude n\'est pas un tableau JSON valide.')
  return blocks
}

// ─── GÉNÉRATION SECTIONS + BLOCS (nouvelle feature) ──────────────────────────

const SECTIONS_SYSTEM_PROMPT = `Tu es un expert en anatomie médicale chargé de transformer un cours de professeur en sections pédagogiques structurées pour une application mobile destinée aux étudiants P2/D1 en médecine.

## MISSION
À partir du texte fourni, tu dois :
1. Identifier les grandes parties thématiques du cours — ce seront les "sections" dans l'application.
2. Pour chaque section, générer des blocs pédagogiques structurés.

## IDENTIFICATION DES SECTIONS
- Si le cours contient des titres explicites (ex : "1. Généralités", "2. Segments", "Branches collatérales"), utilise-les tels quels comme titres de section.
- Sinon, découpe logiquement le cours en parties thématiques cohérentes (chaque section = un thème précis).
- Nombre de sections : entre 2 et 8 selon la richesse du cours.

## TON ET TERMINOLOGIE
Pédagogique et structuré. Phrases affirmatives, directes, comme un manuel bien écrit. Niveau P2/D1.
Français principal. Termes latins entre parenthèses quand utiles.

## TYPES DE BLOCS
- "introduction" : définition, présentation générale
- "anatomy" : description anatomique — une structure par bloc
- "innervation" : innervation et vascularisation
- "function" : rôles fonctionnels
- "key_points" : points clés d'examen — UNIQUEMENT si le professeur les mentionne
- "recap_table" : tableau récapitulatif Markdown — UNIQUEMENT si plusieurs structures comparables
- "image_placeholder" : schéma anatomique recommandé — insérer dès qu'utile

## FORMAT DE SORTIE
Retourner UNIQUEMENT un tableau JSON valide. Aucun texte avant ou après. Aucun bloc Markdown. Juste le JSON brut.

[
  {
    "sectionTitle": "Titre de la section",
    "blocks": [
      {
        "id": "s1_b1",
        "type": "introduction" | "anatomy" | "innervation" | "function" | "key_points" | "recap_table",
        "title": "Titre court",
        "content": "Contenu réécrit, 4-5 phrases max. Pour recap_table : tableau Markdown.",
        "colorIndex": 0
      },
      {
        "id": "s1_b2",
        "type": "image_placeholder",
        "title": "Titre du schéma",
        "description": "Description précise : angle de vue, structures à faire apparaître, légendes",
        "position": "full" | "right" | "left",
        "colorIndex": 1
      }
    ]
  }
]

## RÈGLES
- colorIndex de 0 à 6 en boucle, incrémenté à chaque nouveau bloc (repart à 0 à chaque nouvelle section)
- Les id sont uniques : format "sN_bM" (N = numéro section, M = numéro bloc)
- Les image_placeholder s'intercalent entre les blocs texte auxquels ils se rapportent
- Un bloc "anatomy" par structure distincte
- "recap_table" en dernier dans sa section si présent
- Aucune information du cours omise, aucune information inventée`

/**
 * Envoie le texte du cours à Claude et retourne les sections + leurs blocs.
 */
export async function generateSectionsWithBlocks(courseText: string): Promise<GeneratedSection[]> {
  const client = makeClient()

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 16000,
    system: SECTIONS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Voici le cours à transformer en sections :\n\n${courseText}` }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const sections = parseJSON<GeneratedSection[]>(raw)
  if (!Array.isArray(sections)) throw new Error('La réponse de Claude n\'est pas un tableau JSON valide.')
  return sections
}
