import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/auth-server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  try {
    // Get the authenticated user
    const user = await getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has completed onboarding
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const hasCompletedOnboarding = preferences.length > 0 && preferences[0].onboardingCompleted;

    // Redirect to onboarding if not completed
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Otherwise redirect to intended destination
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}