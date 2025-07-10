import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/stripe-server';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status === 'paid' && session.metadata?.userId) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await handleSubscriptionCreated(session.metadata.userId, subscription);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.userId) {
          await handleSubscriptionUpdate(subscription.metadata.userId, subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.userId) {
          await handleSubscriptionCanceled(subscription.metadata.userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        
        if (subscription.metadata?.userId) {
          await handlePaymentSucceeded(subscription.metadata.userId, invoice);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        
        if (subscription.metadata?.userId) {
          await handlePaymentFailed(subscription.metadata.userId, invoice);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(userId: string, subscription: Stripe.Subscription) {
  const plan = subscription.items.data[0].price.lookup_key || 'pro';
  const interval = subscription.items.data[0].price.recurring?.interval || 'month';
  
  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    plan: 'pro',
    status: subscription.status === 'active' ? 'active' : 'inactive',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    metadata: { interval },
  }).onConflictDoUpdate({
    target: subscriptions.userId,
    set: {
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      plan: 'pro',
      status: subscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: { interval },
      updatedAt: new Date(),
    },
  });
}

async function handleSubscriptionUpdate(userId: string, subscription: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: subscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}

async function handleSubscriptionCanceled(userId: string) {
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      plan: 'free',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}

async function handlePaymentSucceeded(userId: string, invoice: Stripe.Invoice) {
  // Reset any grace period if payment succeeds
  await db
    .update(subscriptions)
    .set({
      isInGracePeriod: false,
      gracePeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}

async function handlePaymentFailed(userId: string, invoice: Stripe.Invoice) {
  // Start a grace period on payment failure
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7 day grace period

  await db
    .update(subscriptions)
    .set({
      isInGracePeriod: true,
      gracePeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}