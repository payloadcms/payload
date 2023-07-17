'use client'

import React, { Fragment, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Settings } from '../../../../payload/payload-types'
import { HR } from '../../../_components/HR'
import { Media } from '../../../_components/Media'
import { Price } from '../../../_components/Price'
import { useAuth } from '../../../_providers/Auth'
import { useCart } from '../../../_providers/Cart'
import { CheckoutForm } from '../CheckoutForm'

import classes from './index.module.scss'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

const CheckoutPageClient: React.FC<{
  settings: Settings
}> = props => {
  const {
    settings: { shopPage },
  } = props

  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [clientSecret, setClientSecret] = React.useState()
  const hasMadePaymentIntent = React.useRef(false)

  const { cart, cartIsEmpty, cartTotal } = useCart()

  useEffect(() => {
    if (user !== null && cartIsEmpty) {
      router.push('/cart')
    }
  }, [router, user, cartIsEmpty])

  useEffect(() => {
    if (user && cart && hasMadePaymentIntent.current === false) {
      hasMadePaymentIntent.current = true

      const makeIntent = async () => {
        try {
          const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/checkout`, {
            method: 'POST',
            credentials: 'include',
          })

          const res = await req.json()

          if (res.error) {
            setError(res.error)
          } else if (res.client_secret) {
            setError(null)
            setClientSecret(res.client_secret)
          }
        } catch (e) {
          setError('Something went wrong.')
        }
      }

      makeIntent()
    }
  }, [cart, user])

  if (!user || !stripe) return null

  return (
    <Fragment>
      {!clientSecret && !error && <div className={classes.loading}>Loading...</div>}
      {!clientSecret && error && (
        <div className={classes.error}>
          <p>Error:</p>
          {error}
        </div>
      )}
      {clientSecret && (
        <Elements
          stripe={stripe}
          options={{
            clientSecret,
          }}
        >
          <h1>Checkout</h1>
          <p>
            This is a self-hosted, secure checkout using Stripe&apos;s Payment Element component.
            Use credit card number <b>4242 4242 4242 4242</b> with any future date and CVC to create
            a mock purchase. An order will be generated in the CMS and will appear in your account.
          </p>
          {error && <p>{error}</p>}
          {cartIsEmpty && (
            <div>
              {'Your '}
              <Link href="/cart">cart</Link>
              {' is empty.'}
              {typeof shopPage === 'object' && shopPage?.slug && (
                <Fragment>
                  {' '}
                  <Link href={`/${shopPage.slug}`}>Continue shopping?</Link>
                </Fragment>
              )}
            </div>
          )}
          {!cartIsEmpty && (
            <div className={classes.items}>
              {cart?.items?.map((item, index) => {
                if (typeof item.product === 'object') {
                  const {
                    quantity,
                    product,
                    product: { title, meta },
                  } = item

                  const isLast = index === (cart?.items?.length || 0) - 1

                  const metaImage = meta?.image

                  return (
                    <Fragment key={index}>
                      <div className={classes.row}>
                        <div className={classes.mediaWrapper}>
                          {!metaImage && <span className={classes.placeholder}>No image</span>}
                          {metaImage && typeof metaImage !== 'string' && (
                            <Media imgClassName={classes.image} resource={metaImage} fill />
                          )}
                        </div>
                        <div className={classes.rowContent}>
                          <h6 className={classes.title}>{title}</h6>
                          {`Quantity: ${quantity}`}
                          <Price product={product} button={false} />
                        </div>
                      </div>
                      {!isLast && <HR />}
                    </Fragment>
                  )
                }
                return null
              })}
              <div className={classes.orderTotal}>{`Order total: ${cartTotal.formatted}`}</div>
            </div>
          )}
          <CheckoutForm />
        </Elements>
      )}
    </Fragment>
  )
}

export default CheckoutPageClient
