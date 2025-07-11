import { NextResponse } from 'next/server';
import { checkAndExpireBetaPlans } from '@/lib/services/beta-expiration';

export async function GET(request: Request) {
  // Verify this is being called by a cron job or authorized source
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await checkAndExpireBetaPlans();
    return NextResponse.json({ success: true, message: 'Beta expiration check completed' });
  } catch (error) {
    console.error('Error in beta expiration cron:', error);
    return NextResponse.json(
      { error: 'Failed to check beta expirations' },
      { status: 500 }
    );
  }
}