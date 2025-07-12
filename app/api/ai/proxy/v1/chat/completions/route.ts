import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
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

    // Extract command type from the prompt if available
    let commandType = 'chat_completion';
    if (body.messages && body.messages.length > 0) {
      const userMessage = body.messages.find((m: any) => m.role === 'user');
      if (userMessage?.content) {
        // Try to identify the command type from the prompt
        const content = userMessage.content.toLowerCase();
        if (content.includes('summarize')) commandType = 'summarize';
        else if (content.includes('improve')) commandType = 'improve';
        else if (content.includes('fix') && content.includes('grammar')) commandType = 'fix_grammar';
        else if (content.includes('translate')) commandType = 'translate';
        else if (content.includes('continue')) commandType = 'continue_writing';
        else if (content.includes('extract') && content.includes('task')) commandType = 'extract_tasks';
        else if (content.includes('formal')) commandType = 'change_tone';
        else if (content.includes('informal') || content.includes('casual')) commandType = 'change_tone';
      }
    }

    // AI usage tracking is handled by the AI extension in the client
    // This prevents duplicate tracking
    console.log('[AI Proxy] Processing request for user:', session.user.email, 'Command type:', commandType);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      );
    }

    // Forward the request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

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