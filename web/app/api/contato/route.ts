import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { nome, email, mensagem } = await req.json()

  if (!mensagem?.trim()) {
    return NextResponse.json({ error: 'Mensagem obrigatória.' }, { status: 400 })
  }

  const token = process.env.PUSHOVER_TOKEN
  const user = process.env.PUSHOVER_USER

  if (!token || !user) {
    return NextResponse.json({ error: 'Serviço de notificação não configurado.' }, { status: 500 })
  }

  const title = 'ADFM — Contato'
  const body = [
    nome ? `Nome: ${nome}` : null,
    email ? `E-mail: ${email}` : null,
    `\n${mensagem}`,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, user, title, message: body }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Falha ao enviar mensagem.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
