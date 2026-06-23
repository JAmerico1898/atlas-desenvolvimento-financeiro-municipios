import { NextResponse } from 'next/server'
import { getImdf } from '@/lib/queries'

export const revalidate = 3600

export async function GET() {
  try {
    return NextResponse.json(await getImdf())
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
