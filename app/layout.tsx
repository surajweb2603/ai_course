import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'AiCourse Generator - AI: The Future of Learning',
  description: 'How artificial intelligence is personalizing and transforming education.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
      </head>
      <body className="font-sans">
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}
