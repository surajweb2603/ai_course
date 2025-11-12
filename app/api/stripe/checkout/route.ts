import { NextRequest, NextResponse } from 'next/server';
import { withAuth, NextAuthRequest } from '@/src/server/http/nextAdapter';
import Stripe from 'stripe';
import User from '@/src/models/User';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Stripe client
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  try {
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
  } catch (error) {
    return null;
  }
};

// POST /api/stripe/checkout - Create Stripe checkout session
export const POST = withAuth(async (req: NextAuthRequest) => {
  if (!req.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          'Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.',
      },
      { status: 500 }
    );
  }

  const { plan } = await req.json();

  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    return NextResponse.json(
      { error: 'Invalid plan. Must be monthly or yearly.' },
      { status: 400 }
    );
  }

  // Check if user already has this plan
  const user = await User.findById(req.user.sub);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  if (user.plan === plan) {
    return NextResponse.json(
      { error: `You are already on the ${plan === 'monthly' ? 'Pro Learner' : 'Yearly Pro'} plan.` },
      { status: 400 }
    );
  }

  const priceId =
    plan === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY;

  if (!priceId) {
    return NextResponse.json(
      { error: 'Stripe price ID not configured' },
      { status: 500 }
    );
  }

  // Get base URL from request headers (works in production) or environment variables
  const getBaseUrl = () => {
    // Try to get from request headers first (most reliable in production)
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (origin) {
      return origin;
    }
    
    if (host) {
      // Construct URL from host header
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      return `${protocol}://${host}`;
    }
    
    // Fall back to environment variables
    if (process.env.APP_BASE_URL) {
      return process.env.APP_BASE_URL;
    }
    
    if (process.env.APP_BASE_URL) {
      return process.env.APP_BASE_URL;
    }
    
    // Last resort: localhost for local development
    return 'http://localhost:3000';
  };

  const baseUrl = getBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?payment=cancel`,
    customer_email: req.user.email,
    metadata: {
      userId: req.user.sub,
      plan: plan,
    },
  });

  return NextResponse.json({ url: session.url });
});
