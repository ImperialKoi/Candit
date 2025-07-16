import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 })
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is an integer (cents)
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error("Stripe error:", error)
    return NextResponse.json(
      {
        error: error.message || "Payment processing failed",
      },
      { status: 400 },
    )
  }
}
