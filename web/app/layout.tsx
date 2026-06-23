import type { Metadata } from 'next'
import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import Header from '@/components/Header'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-heading'
})
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-body'
})

export const metadata: Metadata = {
  title: 'Atlas de Desenvolvimento Financeiro dos Municípios',
  description: 'Indicadores de inclusão financeira por município brasileiro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${sourceSans.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
