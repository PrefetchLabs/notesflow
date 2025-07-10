import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { notes, collaborators, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PublicNoteViewer } from './public-note-viewer';

interface PublicNotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const { id } = await params;
  
  // Check if note has public access enabled
  const [publicAccess] = await db
    .select()
    .from(collaborators)
    .where(and(
      eq(collaborators.noteId, id),
      eq(collaborators.userId, 'public-access')
    ))
    .limit(1);

  if (!publicAccess) {
    notFound();
  }

  // Get the note with user info
  const [note] = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      userName: user.name,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .leftJoin(user, eq(notes.userId, user.id))
    .where(eq(notes.id, id))
    .limit(1);

  if (!note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{note.title || 'Untitled Note'}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Shared by {note.userName || 'Anonymous'} • View-only access
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Note viewer */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <PublicNoteViewer
            noteId={id}
            content={note.content as any}
            title={note.title}
          />
        </div>
      </div>
    </div>
  );
}