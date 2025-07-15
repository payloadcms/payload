'use client'

import { LoadingShimmer } from '@/components/LoadingShimmer'
import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { Fragment, Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { cssVariables } from '@/cssVariables'
import { CheckoutForm } from '../CheckoutForm'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/react'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart } = useCart()
  const [error, setError] = useState<null | string>(null)
  const { theme } = useTheme()
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const { paymentData, initiatePayment, selectedPaymentMethod, paymentMethods } = usePayments()

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const initiatePaymentIntent = async (paymentID: string) => {
    console.log('initiating payment intent', paymentID)
    const paymentIntent = await initiatePayment(paymentID, {
      additionalData: {
        ...(email ? { customerEmail: email } : {}),
      },
    })

    console.log({ paymentIntent })
  }

  if (!stripe) return null

  return (
    <div className="flex flex-col items-stretch justify-stretch md:flex-row grow">
      <div className="basis-full lg:basis-1/2 flex flex-col gap-8 lg:pr-8 pt-8">
        <h2 className="font-medium text-3xl">Contact</h2>
        {!user && (
          <div className="prose dark:prose-invert bg-black rounded-sm p-4 grow w-full flex items-center">
            <Button asChild className="no-underline text-inherit" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
            <p className="mt-0">
              <span className="mx-2">or</span>
              <Link href="/create-account">create an account</Link>
            </p>
          </div>
        )}
        {user ? (
          <div className="bg-black rounded-sm p-4 w-full">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                Not you? <Link href="/logout">Log out</Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-black rounded-sm p-4 w-full">
            <div>
              <p className="mb-4">Enter your email to checkout as a guest.</p>
              <div className="max-w-sm mb-4">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </div>
              <Button
                disabled={!email || !emailEditable}
                onClick={() => {
                  setEmailEditable(false)
                }}
                variant="default"
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}

        <h2 className="font-medium text-3xl">Payment</h2>

        {cartIsEmpty && (
          <div className="prose dark:prose-invert">
            <p>
              Your cart is empty.
              <Link href="/search">Continue shopping?</Link>
            </p>
          </div>
        )}
        {!paymentData?.['clientSecret'] && !error && (
          <div className="my-8">
            <LoadingShimmer number={1} />
          </div>
        )}
        {!paymentData?.['clientSecret'] && error && (
          <div className="my-8">
            <Message error={error} />

            <Button onClick={() => router.refresh()} variant="default">
              Try again
            </Button>
          </div>
        )}

        <Button onClick={() => void initiatePaymentIntent('stripe')}>Confirm address</Button>

        <Suspense fallback={<React.Fragment />}>
          {/* @ts-ignore */}
          {paymentData && paymentData?.['clientSecret'] && (
            <Fragment>
              {error && <p>{`Error: ${error}`}</p>}
              <Elements
                options={{
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      borderRadius: '6px',
                      colorPrimary: '#858585',
                      gridColumnSpacing: '20px',
                      gridRowSpacing: '20px',
                      colorBackground: theme === 'dark' ? '#0a0a0a' : cssVariables.colors.base0,
                      colorDanger: cssVariables.colors.error500,
                      colorDangerText: cssVariables.colors.error500,
                      colorIcon:
                        theme === 'dark' ? cssVariables.colors.base0 : cssVariables.colors.base1000,
                      colorText: theme === 'dark' ? '#858585' : cssVariables.colors.base1000,
                      colorTextPlaceholder: '#858585',
                      fontFamily: 'Geist, sans-serif',
                      fontSizeBase: '16px',
                      fontWeightBold: '600',
                      fontWeightNormal: '500',
                      spacingUnit: '4px',
                    },
                  },
                  clientSecret: paymentData['clientSecret'] as string,
                }}
                stripe={stripe}
              >
                <CheckoutForm customerEmail={email} />
              </Elements>
            </Fragment>
          )}
        </Suspense>
      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/2 lg:pl-8 p-8 border-l bg-primary/5 flex flex-col gap-8">
          <h2 className="text-3xl font-medium">Your cart</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              const image = gallery?.[0] || meta?.image

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {image && typeof image !== 'string' && (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {variant && typeof variant === 'object' && (
                        <p className="text-sm font-mono text-primary/50 tracking-[0.1em]">
                          {variant.options
                            ?.map((option) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {product.priceInUSD && <Price amount={product.priceInUSD} />}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />
          <div className="flex justify-between items-center gap-2">
            <span className="uppercase">Total</span>{' '}
            <Price className="text-3xl font-medium" amount={cart.subtotal || 0} />
          </div>
        </div>
      )}
    </div>
  )
}
