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

// POST /api/stripe/confirm - Confirm payment and update user plan
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

  const { session_id } = await req.json();

  if (!session_id) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  // Retrieve the session from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['line_items', 'subscription'],
  });

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ ok: false, error: 'Payment not completed' });
  }

  // Determine the plan based on the price ID
  let plan: 'monthly' | 'yearly' = 'monthly';

  if (
    session.line_items?.data?.[0]?.price?.id === process.env.STRIPE_PRICE_YEARLY
  ) {
    plan = 'yearly';
  } else if (
    session.line_items?.data?.[0]?.price?.id ===
    process.env.STRIPE_PRICE_MONTHLY
  ) {
    plan = 'monthly';
  }

  // Update user's plan
  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { plan: plan },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, plan: user.plan });
});
