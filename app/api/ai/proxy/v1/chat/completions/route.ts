import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { subscriptions, aiUsage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.role === 'admin' || session.user.role === 'system_admin';
    
    // Check subscription for AI access (admins bypass subscription check)
    if (!isAdmin) {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id));

      const allowedPlans = ['beta', 'pro_monthly', 'pro_yearly', 'early_bird'];
      if (!subscription || !allowedPlans.includes(subscription.plan || '')) {
        return NextResponse.json(
          { 
            error: 'AI features are only available for Beta and Pro users',
            requiresUpgrade: true,
            feature: 'ai_assistant'
          },
          { status: 403 }
        );
      }
    }

    // Get the request body
    const body = await req.json();

    // Track AI usage
    await db.insert(aiUsage).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      model: body.model || 'gpt-4o-mini',
      endpoint: 'chat.completions',
      inputTokens: JSON.stringify(body).length / 4, // Rough estimate
      outputTokens: 0, // Will be updated after response
      cost: 0, // Calculate based on model pricing
      metadata: {
        noteId: body.metadata?.noteId,
        feature: body.metadata?.feature || 'editor',
      },
    });

    // Forward the request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    // Return the response
    if (body.stream) {
      // For streaming responses, forward the stream
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // For non-streaming responses
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('AI proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}