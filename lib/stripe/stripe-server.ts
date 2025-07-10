import Stripe from 'stripe';

if (!process.env['STRIPE_SECRET_KEY']) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'], {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe price IDs
export const STRIPE_PRICES = {
  monthly: process.env['STRIPE_PRICE_MONTHLY_ID'] || '',
  yearly: process.env['STRIPE_PRICE_YEARLY_ID'] || '',
} as const;

// Stripe webhook secret
export const STRIPE_WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] || '';

// URLs
export const getURL = () => {
  let url =
    process.env['NEXT_PUBLIC_APP_URL'] ??
    process.env['NEXT_PUBLIC_VERCEL_URL'] ??
    'http://localhost:3000/';
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  
  return url;
};

export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const baseUrl = getURL();
  
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl || `${baseUrl}payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${baseUrl}upgrade`,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl?: string;
}) {
  const baseUrl = getURL();
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${baseUrl}dashboard`,
  });

  return session;
}