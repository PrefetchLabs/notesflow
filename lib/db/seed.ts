import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { user, folders, notes, timeBlocks, collaborators } from './schema';
import { sql } from 'drizzle-orm';

// Sample BlockNote content
const sampleNoteContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Welcome to NotesFlow!' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is a sample note to demonstrate the rich text capabilities.',
        },
      ],
    },
    {
      type: 'bulletListItem',
      content: [
        { type: 'text', text: 'Create beautiful notes with BlockNote editor' },
      ],
    },
    {
      type: 'bulletListItem',
      content: [
        { type: 'text', text: 'Organize with folders and tags' },
      ],
    },
    {
      type: 'bulletListItem',
      content: [
        { type: 'text', text: 'Schedule time blocks by dragging text' },
      ],
    },
  ],
};

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Clear existing data in the correct order
    console.log('🧹 Clearing existing data...');
    await db.delete(collaborators).execute();
    await db.delete(timeBlocks).execute();
    await db.delete(notes).execute();
    await db.delete(folders).execute();
    
    // Note: We don't delete users as they're managed by Better Auth
    // Get the first user from the database (assuming at least one exists from auth)
    const existingUsers = await db.select().from(user).limit(1).execute();
    
    if (existingUsers.length === 0) {
      console.log('⚠️  No users found. Please sign up first through the app.');
      return;
    }

    const testUser = existingUsers[0];
    console.log(`👤 Using existing user: ${testUser.email}`);

    // Create folders
    console.log('📁 Creating folders...');
    const personalFolder = await db
      .insert(folders)
      .values({
        name: 'Personal',
        userId: testUser.id,
        position: 0,
        path: '/personal',
        color: '#10B981', // Green
        icon: 'user',
      })
      .returning()
      .execute();

    const workFolder = await db
      .insert(folders)
      .values({
        name: 'Work',
        userId: testUser.id,
        position: 1,
        path: '/work',
        color: '#3B82F6', // Blue
        icon: 'briefcase',
      })
      .returning()
      .execute();

    const ideasFolder = await db
      .insert(folders)
      .values({
        name: 'Ideas',
        userId: testUser.id,
        position: 2,
        path: '/ideas',
        color: '#F59E0B', // Amber
        icon: 'lightbulb',
      })
      .returning()
      .execute();

    // Create a subfolder
    const projectsFolder = await db
      .insert(folders)
      .values({
        name: 'Projects',
        userId: testUser.id,
        parentId: workFolder[0].id,
        position: 0,
        path: '/work/projects',
        color: '#8B5CF6', // Purple
        icon: 'folder',
      })
      .returning()
      .execute();

    // Create notes
    console.log('📝 Creating notes...');
    const welcomeNote = await db
      .insert(notes)
      .values({
        title: 'Welcome to NotesFlow',
        content: sampleNoteContent,
        userId: testUser.id,
        folderId: personalFolder[0].id,
        tags: ['welcome', 'tutorial'],
        isPinned: true,
      })
      .returning()
      .execute();

    const meetingNote = await db
      .insert(notes)
      .values({
        title: 'Team Meeting Notes',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: 'Weekly Team Sync' }],
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Date: ' },
                { type: 'text', text: 'Monday, 10:00 AM', styles: { bold: true } },
              ],
            },
            {
              type: 'heading',
              props: { level: 3 },
              content: [{ type: 'text', text: 'Agenda' }],
            },
            {
              type: 'numberedListItem',
              content: [{ type: 'text', text: 'Review last week\'s progress' }],
            },
            {
              type: 'numberedListItem',
              content: [{ type: 'text', text: 'Discuss blockers' }],
            },
            {
              type: 'numberedListItem',
              content: [{ type: 'text', text: 'Plan for upcoming sprint' }],
            },
          ],
        },
        userId: testUser.id,
        folderId: workFolder[0].id,
        tags: ['meeting', 'team'],
      })
      .returning()
      .execute();

    const ideaNote = await db
      .insert(notes)
      .values({
        title: 'App Feature Ideas',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: '💡 Feature Brainstorming' }],
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Some ideas for future features:' },
              ],
            },
            {
              type: 'checkListItem',
              props: { checked: false },
              content: [{ type: 'text', text: 'AI-powered writing suggestions' }],
            },
            {
              type: 'checkListItem',
              props: { checked: true },
              content: [{ type: 'text', text: 'Dark mode support' }],
            },
            {
              type: 'checkListItem',
              props: { checked: false },
              content: [{ type: 'text', text: 'Mobile app development' }],
            },
          ],
        },
        userId: testUser.id,
        folderId: ideasFolder[0].id,
        tags: ['ideas', 'features', 'product'],
      })
      .returning()
      .execute();

    // Create time blocks
    console.log('📅 Creating time blocks...');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await db
      .insert(timeBlocks)
      .values({
        title: 'Review NotesFlow features',
        userId: testUser.id,
        noteId: welcomeNote[0].id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour
        color: '#10B981',
        reminderMinutes: 15,
      })
      .execute();

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(14, 0, 0, 0);

    await db
      .insert(timeBlocks)
      .values({
        title: 'Team Meeting',
        userId: testUser.id,
        noteId: meetingNote[0].id,
        startTime: dayAfter,
        endTime: new Date(dayAfter.getTime() + 90 * 60 * 1000), // 1.5 hours
        color: '#3B82F6',
        recurrenceRule: {
          freq: 'WEEKLY',
          interval: 1,
          byday: ['MO'],
        },
      })
      .execute();

    console.log('✅ Seed completed successfully!');
    console.log(`
📊 Created:
- 4 folders (including 1 subfolder)
- 3 notes with rich content
- 2 time blocks (1 recurring)
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// Run the seed
seed().catch((error) => {
  console.error('Fatal error during seed:', error);
  process.exit(1);
});