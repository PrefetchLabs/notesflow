import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe/stripe-server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceType } = await req.json();
    
    if (!priceType || !['monthly', 'yearly'].includes(priceType)) {
      return NextResponse.json({ error: 'Invalid price type' }, { status: 400 });
    }

    const priceId = STRIPE_PRICES[priceType as keyof typeof STRIPE_PRICES];
    
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    const checkoutSession = await createCheckoutSession({
      priceId,
      userId: session.user.id,
      userEmail: session.user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}