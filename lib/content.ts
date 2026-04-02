/**
 * lib/content.ts — Couche de données pour la hiérarchie de contenu.
 * Toutes les interactions Supabase passent par ici.
 * Aucun composant UI ne doit appeler Supabase directement.
 */

import { supabase } from '@/lib/supabase'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Subject {
  id: string
  name: string
  level: string
  created_at: string
}

export interface Course {
  id: number
  subject_id: number
  title: string
  order: number
  created_at: string
}

export interface Chapter {
  id: number
  course_id: number
  title: string
  order: number
  created_at: string
}

export interface LevelStats {
  subjectCount: number
  courseCount: number
  chapterCount: number
}

// ─── STATS ────────────────────────────────────────────────────────────────────

/**
 * Calcule les compteurs (matières, chapitres, cours) pour chacun des 4 niveaux.
 * Utilisé pour afficher les cartes de niveau sur la page hiérarchie.
 */
export async function getLevelStats(): Promise<Record<string, LevelStats>> {
  // 1. Récupère toutes les matières avec leur niveau
  const { data: subjects } = await supabase.from('subjects').select('id, level')
  if (!subjects || subjects.length === 0) {
    return { lycee: empty(), pass: empty(), p2: empty(), d1: empty() }
  }

  // 2. Groupe les ids de matières par niveau
  const idsByLevel: Record<string, string[]> = {}
  for (const s of subjects) {
    if (!idsByLevel[s.level]) idsByLevel[s.level] = []
    idsByLevel[s.level].push(s.id)
  }

  // 3. Récupère tous les cours (chapitres) liés à ces matières
  const allSubjectIds = subjects.map(s => s.id)
  const { data: courses } = await supabase
    .from('courses')
    .select('id, subject_id')
    .in('subject_id', allSubjectIds)

  // Map course_id → subject_id pour calculer les stats par niveau
  const courseSubjectMap: Record<string, string> = {}
  for (const c of courses ?? []) {
    courseSubjectMap[c.id] = c.subject_id
  }

  // 4. Récupère tous les chapitres (cours) liés à ces courses
  const allCourseIds = Object.keys(courseSubjectMap)
  const chapterCounts: Record<string, number> = {}

  if (allCourseIds.length > 0) {
    const { data: chapters } = await supabase
      .from('chapters')
      .select('course_id')
      .in('course_id', allCourseIds)

    for (const ch of chapters ?? []) {
      chapterCounts[ch.course_id] = (chapterCounts[ch.course_id] ?? 0) + 1
    }
  }

  // 5. Calcule les totaux par niveau
  const stats: Record<string, LevelStats> = {}
  const levels = ['lycee', 'pass', 'p2', 'd1']

  for (const level of levels) {
    const levelSubjectIds = idsByLevel[level] ?? []
    const levelCourseIds = Object.entries(courseSubjectMap)
      .filter(([, sid]) => levelSubjectIds.includes(sid))
      .map(([cid]) => cid)
    const levelChapterCount = levelCourseIds.reduce(
      (sum, cid) => sum + (chapterCounts[cid] ?? 0),
      0
    )
    stats[level] = {
      subjectCount: levelSubjectIds.length,
      courseCount: levelCourseIds.length,
      chapterCount: levelChapterCount,
    }
  }

  return stats
}

/** Retourne des stats vides (zéro) pour un niveau sans contenu. */
function empty(): LevelStats {
  return { subjectCount: 0, courseCount: 0, chapterCount: 0 }
}

// ─── FETCH ────────────────────────────────────────────────────────────────────

/**
 * Récupère les matières d'un niveau éducatif donné (p2, d1, lycee, pass).
 */
export async function getSubjectsByLevel(level: string): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('level', level)
    .order('name')
  if (error || !data) return []
  return data
}

/**
 * Récupère les chapitres (courses) liés à une matière.
 */
export async function getCoursesBySubject(subjectId: number): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('subject_id', subjectId)
    .order('order', { ascending: true })
  if (error || !data) return []
  return data
}

/**
 * Récupère les cours (chapters) liés à un chapitre, triés par ordre.
 */
export async function getChaptersByCourse(courseId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true })
  if (error || !data) return []
  return data
}

/**
 * Retourne le prochain numéro d'ordre disponible pour un parent donné.
 * Utilise max(order) + 1 pour éviter les doublons même après suppression.
 */
export async function getNextOrder(
  table: 'courses' | 'chapters' | 'sections',
  parentColumn: string,
  parentId: number
): Promise<number> {
  const { data } = await supabase
    .from(table)
    .select('order')
    .eq(parentColumn, parentId)
    .order('order', { ascending: false })
    .limit(1)
  if (!data || data.length === 0) return 1
  return (data[0].order ?? 0) + 1
}

// ─── DELETE (avec vérification des enfants) ───────────────────────────────────

/**
 * Supprime une matière uniquement si elle n'a aucun chapitre associé.
 * Retourne une erreur explicite si des enfants existent.
 */
export async function deleteSubject(id: string): Promise<{ error: string | null }> {
  const { count } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', id)

  if ((count ?? 0) > 0) {
    return { error: 'Cette matière contient des cours. Supprimez-les d\'abord.' }
  }

  const { error } = await supabase.from('subjects').delete().eq('id', id)
  return { error: error?.message ?? null }
}

/**
 * Supprime un chapitre (course) uniquement s'il n'a aucun cours associé.
 */
export async function deleteCourse(id: string): Promise<{ error: string | null }> {
  const { count } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)

  if ((count ?? 0) > 0) {
    return { error: 'Ce cours contient des chapitres. Supprimez-les d\'abord.' }
  }

  const { error } = await supabase.from('courses').delete().eq('id', id)
  return { error: error?.message ?? null }
}

/**
 * Supprime un cours (chapter) uniquement s'il n'a aucune section associée.
 */
export async function deleteChapter(id: string): Promise<{ error: string | null }> {
  const { count } = await supabase
    .from('sections')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', id)

  if ((count ?? 0) > 0) {
    return { error: 'Ce chapitre contient des sections. Supprimez-les d\'abord.' }
  }

  const { error } = await supabase.from('chapters').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

export interface Section {
  id: number
  chapter_id: number
  title: string
  order: number
  status: string
  is_free: boolean
  created_at: string
}

/**
 * Récupère les sections liées à un chapitre, triées par ordre.
 */
export async function getSectionsByChapter(chapterId: string): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('order', { ascending: true })
  if (error || !data) return []
  return data
}

/**
 * Supprime une section uniquement si elle n'a aucun flashcard associé.
 */
export async function deleteSection(id: string): Promise<{ error: string | null }> {
  const { count } = await supabase
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('section_id', id)

  if ((count ?? 0) > 0) {
    return { error: 'Cette section contient des flashcards. Supprimez-les d\'abord.' }
  }

  const { error } = await supabase.from('sections').delete().eq('id', id)
  return { error: error?.message ?? null }
}
