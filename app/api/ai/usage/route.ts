import { NextResponse } from 'next/server';
import { checkAIUsageLimit } from '@/app/actions/ai';

export async function GET() {
  try {
    const usageData = await checkAIUsageLimit();
    return NextResponse.json(usageData);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching AI usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI usage' },
      { status: 500 }
    );
  }
}