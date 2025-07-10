import type { Metadata } from 'next';
import './globals.css';
import { WebVitals } from '@/components/web-vitals';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AdminProvider } from '@/components/providers/admin-provider';
import { DragDropProvider } from '@/contexts/drag-drop-context';

export const metadata: Metadata = {
  title: 'NotesFlow - Your thoughts and time, beautifully unified',
  description:
    'A minimalist productivity workspace that uniquely combines note-taking with time-blocking in a breathtakingly simple, clean interface.',
  keywords: ['notes', 'productivity', 'time-blocking', 'writing', 'focus'],
  authors: [{ name: 'NotesFlow Team' }],
  openGraph: {
    title: 'NotesFlow',
    description: 'Your thoughts and time, beautifully unified.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
