import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AdminProvider } from '@/components/providers/admin-provider';
import { DragDropProvider } from '@/contexts/drag-drop-context';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'NotesFlow - AI-Powered Note Taking & Calendar Integration',
  description:
    'Transform your productivity with AI-powered note-taking, smart calendar integration, and real-time collaboration. Start your free trial today.',
  keywords: [
    'note-taking app',
    'AI notes',
    'calendar integration',
    'productivity app',
    'time-blocking',
    'collaboration tools',
    'digital notes',
    'task management',
    'AI writing assistant',
    'real-time collaboration'
  ],
  authors: [{ name: 'NotesFlow Team' }],
  openGraph: {
    title: 'NotesFlow - AI-Powered Note Taking & Calendar Integration',
    description: 'Transform your productivity with AI-powered note-taking, smart calendar integration, and real-time collaboration.',
    type: 'website',
    url: 'https://notesflow.app',
    siteName: 'NotesFlow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NotesFlow - Your thoughts and time, beautifully unified',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotesFlow - AI-Powered Note Taking',
    description: 'Transform your productivity with AI-powered note-taking and smart calendar integration.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AdminProvider>
              <DragDropProvider>
                {children}
              </DragDropProvider>
            </AdminProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
