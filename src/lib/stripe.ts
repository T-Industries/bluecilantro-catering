import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// Helper to convert dollars to cents for Stripe
export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

// Helper to convert cents to dollars
export function toDollars(cents: number): number {
  return cents / 100
}
