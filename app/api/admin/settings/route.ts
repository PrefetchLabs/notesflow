import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema/system';
import { eq } from 'drizzle-orm';
import { requireSystemAdmin } from '@/lib/auth/admin-check';

// GET /api/admin/settings - Get all system settings
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const adminCheck = await requireSystemAdmin();
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    // Fetch all settings from database
    const settings = await db.select().from(systemSettings);
    
    // Transform array to object grouped by category
    const settingsObject = settings.reduce((acc: any, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      
      // Parse JSON values
      try {
        acc[setting.category][setting.key] = JSON.parse(setting.value);
      } catch {
        acc[setting.category][setting.key] = setting.value;
      }
      
      return acc;
    }, {});

    // Add default values for missing settings
    const defaultSettings = {
      general: {
        siteName: 'NotesFlow',
        siteDescription: 'A collaborative note-taking platform',
        supportEmail: '',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        maintenanceMode: false,
        maintenanceMessage: '',
        registrationEnabled: true,
        emailVerificationRequired: true,
        maxNotesPerUser: 0,
        maxFoldersPerUser: 0,
        maxFileSize: 10,
      },
      features: {
        collaboration: true,
        ai_writing: true,
        version_history: true,
        public_sharing: true,
        markdown_export: true,
        pdf_export: true,
        templates: false,
        plugins: false,
        offline_mode: false,
        mobile_app: false,
        code_blocks: true,
        math_rendering: true,
        webhooks: false,
        api_access: false,
        advanced_search: true,
      },
      subscriptions: [],
      maintenance: {
        lastBackup: null,
        lastCleanup: null,
        lastOptimization: null,
        cacheSize: 0,
        dbSize: 0,
        storageUsed: 0,
        storageLimit: 5368709120, // 5GB
      },
    };

    // Merge with defaults
    const mergedSettings = {
      ...defaultSettings,
      ...settingsObject,
    };

    return NextResponse.json(mergedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(request: NextRequest) {
  try {
    // Check admin permissions
    const adminCheck = await requireSystemAdmin();
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const updates = await request.json();

    // Process each category
    for (const [category, settings] of Object.entries(updates)) {
      if (typeof settings === 'object' && settings !== null) {
        for (const [key, value] of Object.entries(settings)) {
          // Convert value to string (JSON for objects/arrays)
          const stringValue = typeof value === 'object' 
            ? JSON.stringify(value) 
            : String(value);

          // Upsert the setting
          await db
            .insert(systemSettings)
            .values({
              category,
              key,
              value: stringValue,
              updatedBy: adminCheck.user.id,
            })
            .onConflictDoUpdate({
              target: [systemSettings.category, systemSettings.key],
              set: {
                value: stringValue,
                updatedBy: adminCheck.user.id,
                updatedAt: new Date(),
              },
            });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}