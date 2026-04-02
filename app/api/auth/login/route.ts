import { NextResponse } from 'next/server'
import { checkPassword, createSession } from '@/lib/auth'

// Route POST /api/auth/login — vérifie le mot de passe et crée la session
export async function POST(request: Request) {
  const { password } = await request.json()

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  await createSession()
  return NextResponse.json({ success: true })
}