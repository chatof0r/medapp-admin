import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const AUTH_SECRET = process.env.AUTH_SECRET!
const COOKIE_NAME = 'medapp_admin_session'

// Vérifie si le mot de passe entré est correct
export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

// Crée la session en posant un cookie signé
export async function createSession() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, AUTH_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
}

// Vérifie si l'utilisateur est connecté
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)
  return session?.value === AUTH_SECRET
}

// Supprime la session (logout)
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}