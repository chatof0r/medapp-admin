import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

// Route POST /api/auth/logout — supprime la session
export async function POST() {
  await destroySession()
  return NextResponse.json({ success: true })
}