import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './test-styles.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
})

export default function TestUILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}