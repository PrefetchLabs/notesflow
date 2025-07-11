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

    return session?.user || null;
  } catch (error) {
    console.error('Failed to get user:', error);
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

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
      },
      session,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      user: null,
    };
  }
}