import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function checkOnboarding() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user has completed onboarding
  const preferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  const hasCompletedOnboarding = preferences.length > 0 && preferences[0].onboardingCompleted;

  if (!hasCompletedOnboarding) {
    redirect('/onboarding');
  }

  return user;
}