"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CreditCard, Smartphone, Lock, ArrowLeft, Check, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import type { CartItem, Product } from "@/lib/types"

// Stripe Imports
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

// PayPal Imports
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

interface CartItemWithProduct extends CartItem {
  product: Product
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHable_KEY || "pk_test_your_key_here")

// Stripe Card Form Component (Unchanged)
function StripeCardForm({ onPaymentSuccess, amount, disabled }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError("")

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError("Card element not found")
      setProcessing(false)
      return
    }

    try {
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      })
      if (paymentMethodError) {
        setError(paymentMethodError.message || "Payment failed")
        setProcessing(false)
        return
      }

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          payment_method_id: paymentMethod.id,
        }),
      })

      const { client_secret, error: serverError } = await response.json()
      if (serverError) {
        setError(serverError)
        setProcessing(false)
        return
      }

      const { error: confirmError } = await stripe.confirmCardPayment(client_secret)
      if (confirmError) {
        setError(confirmError.message || "Payment confirmation failed")
      } else {
        onPaymentSuccess()
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    }
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
        <CardElement
          options={{ style: { base: { fontSize: "16px", color: "#ffffff", "::placeholder": { color: "#9ca3af" } } } }}
        />
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <Button
        type="submit"
        disabled={!stripe || processing || disabled}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  )
}

// PayPal Component using the exact pattern that works
function PayPalCheckout({ amount, onPaymentSuccess }: { amount: number; onPaymentSuccess: () => void }) {
  return (
    <div style={{ padding: 20 }}>
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
          currency: "USD",
          components: "buttons",
        }}
      >
        <PayPalButtons
          createOrder={(data, actions) => {
            if (!actions.order) return Promise.reject("PayPal actions.order is undefined")
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: { value: amount.toFixed(2), currency_code: "USD" },
                  description: "Candit Purchase",
                },
              ],
            })
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return
            await actions.order.capture()
            onPaymentSuccess()
          }}
        />
      </PayPalScriptProvider>
      <p className="text-xs text-gray-500 mt-2 text-center">
        You will be redirected to PayPal to complete your payment.
      </p>
    </div>
  )
}

const handleInteracPayment = async (
  firstName: string,
  lastName: string,
  address: string,
  city: string,
  postalCode: string,
  setProcessing: any,
  totalAmount: number,
  handlePaymentSuccess: any,
) => {
  if (!firstName || !lastName || !address || !city || !postalCode) {
    alert("Please fill in all shipping information")
    return
  }

  setProcessing(true)
  const orderRef = `ORD-${Date.now()}`
  const instructions = `Interac e-Transfer Payment Instructions:\n\nSend: $${totalAmount.toFixed(2)} CAD\nTo: payments@candit.com\nReference: ${orderRef}\nSecurity Question: What is your order number?\nAnswer: ${orderRef}\n\nYour order will be processed within 24 hours of payment receipt.\nYou will receive a confirmation email once payment is verified.`
  alert(instructions)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  await handlePaymentSuccess()
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [user, setUser] = useState<any>(null)
  const [orderComplete, setOrderComplete] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("Canada")

  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }
    setUser(user)
    setEmail(user.email || "")
    fetchCartItems(user.id)
  }

  const fetchCartItems = async (userId: string) => {
    const { data, error } = await supabase.from("cart_items").select(`*, product:products(*)`).eq("user_id", userId)
    if (!error && data) {
      setCartItems(data as CartItemWithProduct[])
    }
    setLoading(false)
  }

  const getTotalPrice = () => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0)

  const getShippingCost = () => {
    const allItemsFreeShipping = cartItems.every((item) => item.product.is_free_shipping)
    return allItemsFreeShipping ? 0 : 5.0 // Flat $5.00 shipping if any item is not free shipping
  }

  const getTaxAmount = () => (getTotalPrice() + getShippingCost()) * 0.13 // Calculate tax on subtotal + shipping

  const getTotalAmount = () => getTotalPrice() + getShippingCost() + getTaxAmount()

  const handlePaymentSuccess = async () => {
    setProcessing(true)
    try {
      const orderData = {
        user_id: user.id,
        total_amount: getTotalAmount(),
        status: "completed",
        payment_method: paymentMethod,
        shipping_address: { firstName, lastName, address, city, postalCode, country },
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      }
      const { error: orderError } = await supabase.from("orders").insert(orderData)
      if (orderError) console.error("Error saving order:", orderError)

      await supabase.from("cart_items").delete().eq("user_id", user.id)

      for (const item of cartItems) {
        await supabase
          .from("products")
          .update({ stock: item.product.stock - item.quantity })
          .eq("id", item.product.id)
      }
      setOrderComplete(true)
    } catch (error) {
      console.error("Error processing order:", error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading checkout...</div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-green-400">Payment Successful!</h1>
            <p className="text-xl text-gray-300 mb-4">
              Thank you for your purchase. Your order has been successfully processed.
            </p>
            <p className="text-gray-400 mb-8">
              Order Total: <span className="text-blue-400 font-bold">${getTotalAmount().toFixed(2)}</span>
            </p>
            <div className="space-x-4">
              <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
                Continue Shopping
              </Button>
              <Button
                onClick={() => router.push("/profile")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalAmount = getTotalAmount()
  const shippingCost = getShippingCost()
  const taxAmount = getTaxAmount()
  const isShippingInfoFilled = firstName && lastName && address && city && postalCode

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.push("/cart")} className="text-gray-300 hover:text-white mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-gray-300">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-gray-300">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="text-gray-300">
                      Postal Code
                    </Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country" className="text-gray-300">
                    Country
                  </Label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                  >
                    <option value="Canada">Canada</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                  <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-blue-400 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
                      Credit/Debit Card (Stripe)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-purple-400 transition-colors">
                    {/* Changed id from "paypal" to "paypal-radio" */}
                    <RadioGroupItem value="paypal" id="paypal-radio" />
                    <Label htmlFor="paypal-radio" className="flex items-center cursor-pointer flex-1">
                      <div className="w-5 h-5 mr-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        P
                      </div>
                      PayPal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-green-400 transition-colors">
                    <RadioGroupItem value="interac" id="interac" />
                    <Label htmlFor="interac" className="flex items-center cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5 mr-2 text-green-400" />
                      Interac e-Transfer
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-6">
                  {paymentMethod === "card" && (
                    <Elements stripe={stripePromise}>
                      <StripeCardForm
                        onPaymentSuccess={handlePaymentSuccess}
                        amount={totalAmount}
                        disabled={!isShippingInfoFilled}
                      />
                    </Elements>
                  )}

                  {paymentMethod === "paypal" && (
                    <div>
                      {!isShippingInfoFilled && (
                        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                          <p className="text-yellow-300 text-sm">Please fill in all shipping information first.</p>
                        </div>
                      )}
                      {isShippingInfoFilled && (
                        <PayPalCheckout amount={totalAmount} onPaymentSuccess={handlePaymentSuccess} />
                      )}
                    </div>
                  )}

                  {paymentMethod === "interac" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                        <p className="text-green-300 text-sm mb-2">
                          Click "Complete Order" to receive Interac e-Transfer payment instructions.
                        </p>
                        <p className="text-green-400 text-xs">
                          Amount: ${totalAmount.toFixed(2)} CAD
                          <br />
                          Email: payments@candit.com
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          handleInteracPayment(
                            firstName,
                            lastName,
                            address,
                            city,
                            postalCode,
                            setProcessing,
                            totalAmount,
                            handlePaymentSuccess,
                          )
                        }
                        disabled={processing || !isShippingInfoFilled}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {processing ? "Processing..." : `Complete Order - $${totalAmount.toFixed(2)}`}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 relative bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white line-clamp-2">{item.product.name}</h4>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        {item.product.is_free_shipping && (
                          <p className="text-xs text-green-400 flex items-center">
                            <Truck className="w-3 h-3 mr-1" /> Free Shipping
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-blue-400">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="bg-gray-700 mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal ({getTotalItems()} items)</span>
                    <span className="text-white">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Shipping</span>
                    {shippingCost === 0 ? (
                      <span className="text-green-400">FREE</span>
                    ) : (
                      <span className="text-white">${shippingCost.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Tax (13%)</span>
                    <span className="text-white">${taxAmount.toFixed(2)}</span>
                  </div>
                </div>
                <Separator className="bg-gray-700 mb-4" />
                <div className="flex justify-between text-lg font-bold mb-6">
                  <span className="text-white">Total</span>
                  <span className="text-blue-400">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-center mb-6 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <Lock className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-green-300 text-sm">Secure SSL Encrypted Payment</span>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
