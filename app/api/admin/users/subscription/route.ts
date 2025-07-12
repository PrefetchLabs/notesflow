import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { eq } from 'drizzle-orm';
import { addDays } from 'date-fns';

export async function PATCH(request: NextRequest) {
  // Check authentication
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check admin permissions
  const hasPermission = await AdminService.checkPermission(
    authResult.user.id,
    ADMIN_PERMISSIONS.USER_UPDATE
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, plan, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Get or create subscription
    let [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (!subscription) {
      // Create new subscription
      const newSubscription = {
        id: crypto.randomUUID(),
        userId,
        plan: plan || 'free',
        status: 'active' as const,
        createdAt: now,
        updatedAt: now,
      };

      // Set limits based on plan
      if (plan === 'beta') {
        Object.assign(newSubscription, {
          limits: {
            maxNotes: 50,
            maxFolders: 10,
            maxAiCalls: 100,
            maxCollaborators: 2,
            maxStorage: 500,
          },
          metadata: {
            betaStartDate: now.toISOString(),
            betaEndDate: addDays(now, 7).toISOString(),
          },
        });
      } else if (plan === 'pro_monthly' || plan === 'pro_yearly') {
        Object.assign(newSubscription, {
          limits: {
            maxNotes: Infinity,
            maxFolders: Infinity,
            maxAiCalls: Infinity,
            maxCollaborators: Infinity,
            maxStorage: Infinity,
          },
        });
      } else {
        // Free plan
        Object.assign(newSubscription, {
          limits: {
            maxNotes: 10,
            maxFolders: 3,
            maxAiCalls: 0,
            maxCollaborators: 0,
            maxStorage: 100,
          },
        });
      }

      await db.insert(subscriptions).values(newSubscription);
      return NextResponse.json({ success: true, message: 'Subscription created' });
    }

    // Update existing subscription
    const updates: any = {
      updatedAt: now,
    };

    if (action === 'changePlan' && plan) {
      updates.plan = plan;
      
      // Update limits based on new plan
      if (plan === 'beta') {
        updates.limits = {
          maxNotes: 50,
          maxFolders: 10,
          maxAiCalls: 100,
          maxCollaborators: 2,
          maxStorage: 500,
        };
        updates.metadata = {
          ...subscription.metadata,
          betaStartDate: now.toISOString(),
          betaEndDate: addDays(now, 7).toISOString(),
          previousPlan: subscription.plan,
        };
      } else if (plan === 'pro_monthly' || plan === 'pro_yearly') {
        updates.limits = {
          maxNotes: Infinity,
          maxFolders: Infinity,
          maxAiCalls: Infinity,
          maxCollaborators: Infinity,
          maxStorage: Infinity,
        };
        updates.cancelAtPeriodEnd = false;
        updates.status = 'active';
      } else {
        // Free plan
        updates.limits = {
          maxNotes: 10,
          maxFolders: 3,
          maxAiCalls: 0,
          maxCollaborators: 0,
          maxStorage: 100,
        };
      }
    } else if (action === 'cancel') {
      updates.cancelAtPeriodEnd = true;
    } else if (action === 'reactivate') {
      updates.cancelAtPeriodEnd = false;
    }

    await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, subscription.id));

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully' 
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}