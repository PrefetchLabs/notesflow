import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
      },
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}