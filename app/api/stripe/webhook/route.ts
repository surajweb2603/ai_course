import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
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

// POST /api/stripe/webhook - Stripe webhook handler
export const POST = publicHandler(async (req: NextRequest) => {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.mode === 'subscription' &&
        session.payment_status === 'paid'
      ) {
        const userId = session.metadata?.userId;

        if (userId) {
          // Determine the plan based on the price ID
          let plan: 'monthly' | 'yearly' = 'monthly';

          if (
            session.line_items?.data?.[0]?.price?.id ===
            process.env.STRIPE_PRICE_YEARLY
          ) {
            plan = 'yearly';
          } else if (
            session.line_items?.data?.[0]?.price?.id ===
            process.env.STRIPE_PRICE_MONTHLY
          ) {
            plan = 'monthly';
          }

          // Update user's plan
          await User.findByIdAndUpdate(userId, { plan });
        }
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        if (event.type === 'customer.subscription.deleted') {
          // Downgrade to free plan
          await User.findByIdAndUpdate(userId, { plan: 'free' });
        } else {
          // Update plan based on subscription
          const priceId = subscription.items.data[0]?.price?.id;
          let plan: 'monthly' | 'yearly' = 'monthly';

          if (priceId === process.env.STRIPE_PRICE_YEARLY) {
            plan = 'yearly';
          } else if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
            plan = 'monthly';
          }

          await User.findByIdAndUpdate(userId, { plan });
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
});
