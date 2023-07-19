'use client'

import React, { Fragment, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Settings } from '../../../../payload/payload-types'
import { HR } from '../../../_components/HR'
import { LoadingShimmer } from '../../../_components/LoadingShimmer'
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
          const paymentReq = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payment-intent`,
            {
              method: 'POST',
              credentials: 'include',
            },
          )

          const res = await paymentReq.json()

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
      {!clientSecret && !error && (
        <div className={classes.loading}>
          <LoadingShimmer number={3} />
        </div>
      )}
      {!clientSecret && error && (
        <div className={classes.error}>
          <p>Error:</p>
          {error}
        </div>
      )}
      {error && <p>{error}</p>}
      {clientSecret && (
        <Elements
          stripe={stripe}
          options={{
            clientSecret,
          }}
        >
          <CheckoutForm />
        </Elements>
      )}
    </Fragment>
  )
}

export default CheckoutPageClient
