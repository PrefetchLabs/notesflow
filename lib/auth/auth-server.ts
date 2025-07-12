import { auth } from './config';
import { headers } from 'next/headers';

export { auth };

// Get current user from session
export async function getUser() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    // Check if user account is active
    if (session?.user && session.user.isActive === false) {
      return null;
    }

    return session?.user || null;
  } catch (error) {
    // [REMOVED_CONSOLE]
    return null;
  }
}

// Authentication middleware for API routes
export async function authMiddleware(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return {
        success: false,
        error: 'No authenticated user',
        user: null,
      };
    }

    // Check if user account is active
    if (session.user.isActive === false) {
      return {
        success: false,
        error: 'Account disabled',
        user: null,
      };
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        isActive: session.user.isActive,
      },
      session,
    };
  } catch (error) {
    // [REMOVED_CONSOLE]
    return {
      success: false,
      error: 'Authentication failed',
      user: null,
    };
  }
}