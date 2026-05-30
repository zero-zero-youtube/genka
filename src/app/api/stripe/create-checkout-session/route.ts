import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const PRICE_IDS = {
  starter: 'price_1TcjuPAXk2a0uJR7I0GjplwI',
  standard: 'price_1TcjvBAXk2a0uJR7thGM51gj',
  pro: 'price_1TcjveAXk2a0uJR7KauWiR5q',
} as const

type PlanKey = keyof typeof PRICE_IDS

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, companyId, email } = await req.json()


    if (!plan || !PRICE_IDS[plan as PlanKey]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!userId || !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan as PlanKey],
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
        companyId: companyId ?? '',
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          companyId: companyId ?? '',
          plan,
        },
        trial_period_days: 30,
      },
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
