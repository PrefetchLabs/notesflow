import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { notes, collaborators, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SharedNoteEditor } from './shared-note-editor';

interface SharedNotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SharedNotePage({ params }: SharedNotePageProps) {
  const { id } = await params;
  
  // Check if note is publicly shared
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
    })
    .from(notes)
    .leftJoin(user, eq(notes.userId, user.id))
    .where(eq(notes.id, id))
    .limit(1);

  if (!note) {
    notFound();
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold">{note.title || 'Untitled Note'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shared by {note.userName || 'Anonymous'} • Real-time collaboration enabled
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-6 py-4">
          <SharedNoteEditor
            noteId={id}
            initialContent={note.content as any}
            noteTitle={note.title}
          />
        </div>
      </div>
    </div>
  );
}