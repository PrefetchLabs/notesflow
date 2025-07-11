import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { desc, ilike, or, and, eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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
    ADMIN_PERMISSIONS.USER_VIEW
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(user.email, `%${search}%`),
          ilike(user.name, `%${search}%`)
        )
      );
    }

    if (role && ['user', 'admin', 'system_admin'].includes(role)) {
      conditions.push(eq(user.role, role as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);
    
    const totalUsers = Number(countResult[0]?.count || 0);

    // Get paginated users with subscription data
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastAdminActivityAt: user.lastAdminActivityAt,
        subscription: {
          id: subscriptions.id,
          plan: subscriptions.plan,
          status: subscriptions.status,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          usage: subscriptions.usage,
          limits: subscriptions.limits,
          metadata: subscriptions.metadata,
        },
      })
      .from(user)
      .leftJoin(subscriptions, eq(user.id, subscriptions.userId))
      .where(whereClause)
      .orderBy(
        sortOrder === 'desc' 
          ? desc(user[sortBy as keyof typeof user]) 
          : user[sortBy as keyof typeof user]
      )
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Update user endpoint
export async function PATCH(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

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
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Prevent self-demotion for system admins
    if (userId === authResult.user.id && updates.role === 'user') {
      return NextResponse.json(
        { error: 'Cannot demote yourself' },
        { status: 400 }
      );
    }

    // Update user
    await db
      .update(user)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}