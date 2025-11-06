import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/stripe/plans - Get available plans
export const GET = publicHandler(async (req: NextRequest) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Basic features',
      features: ['Limited course generations', 'Basic support']
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: 9,
      stripePriceId: process.env.STRIPE_PRICE_MONTHLY,
      description: 'Monthly subscription',
      features: ['Unlimited course generations', 'Priority support', 'Advanced features']
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 99,
      stripePriceId: process.env.STRIPE_PRICE_YEARLY,
      description: 'Yearly subscription (2 months free!)',
      features: ['Unlimited course generations', 'Priority support', 'Advanced features', '2 months free']
    }
  ];

  return NextResponse.json(plans);
});
