import { auth } from '@/lib/auth/config';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(null);
  }

  return NextResponse.json(session);
}