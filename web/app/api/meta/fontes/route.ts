import { NextResponse } from 'next/server'
import { getFontes } from '@/lib/queries'

export const revalidate = 86400

export async function GET() {
  try {
    return NextResponse.json(await getFontes())
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
