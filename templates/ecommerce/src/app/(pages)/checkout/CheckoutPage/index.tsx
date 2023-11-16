'use client'

import React, { Fragment, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Settings } from '../../../../payload/payload-types'
import { Button } from '../../../_components/Button'
import { HR } from '../../../_components/HR'
import { LoadingShimmer } from '../../../_components/LoadingShimmer'
import { Media } from '../../../_components/Media'
import { Price } from '../../../_components/Price'
import { useAuth } from '../../../_providers/Auth'
import { useCart } from '../../../_providers/Cart'
import { useTheme } from '../../../_providers/Theme'
import cssVariables from '../../../cssVariables'
import { CheckoutForm } from '../CheckoutForm'

import classes from './index.module.scss'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

export const CheckoutPage: React.FC<{
  settings: Settings
}> = props => {
  const {
    settings: { productsPage },
  } = props

  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [clientSecret, setClientSecret] = React.useState()
  const hasMadePaymentIntent = React.useRef(false)
  const { theme } = useTheme()

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
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-payment-intent`,
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
          {typeof productsPage === 'object' && productsPage?.slug && (
            <Fragment>
              {' '}
              <Link href={`/${productsPage.slug}`}>Continue shopping?</Link>
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
                product: { id, stripeProductID, title, meta },
              } = item

              if (!quantity) return null

              const isLast = index === (cart?.items?.length || 0) - 1

              const metaImage = meta?.image

              return (
                <Fragment key={index}>
                  <div className={classes.row}>
                    <div className={classes.mediaWrapper}>
                      {!metaImage && <span className={classes.placeholder}>No image</span>}
                      {metaImage && typeof metaImage !== 'string' && (
                        <Media
                          className={classes.media}
                          imgClassName={classes.image}
                          resource={metaImage}
                          fill
                        />
                      )}
                    </div>
                    <div className={classes.rowContent}>
                      {!stripeProductID && (
                        <p className={classes.warning}>
                          {'This product is not yet connected to Stripe. To link this product, '}
                          <Link
                            href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/products/${id}`}
                          >
                            edit this product in the admin panel
                          </Link>
                          {'.'}
                        </p>
                      )}
                      <h6 className={classes.title}>{title}</h6>
                      <Price product={product} button={false} quantity={quantity} />
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
          <LoadingShimmer number={2} />
        </div>
      )}
      {!clientSecret && error && (
        <div className={classes.error}>
          <p>{`Error: ${error}`}</p>
          <Button label="Back to cart" href="/cart" appearance="secondary" />
        </div>
      )}
      {clientSecret && (
        <Fragment>
          {error && <p>{`Error: ${error}`}</p>}
          <Elements
            stripe={stripe}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorText:
                    theme === 'dark' ? cssVariables.colors.base0 : cssVariables.colors.base1000,
                  fontSizeBase: '16px',
                  fontWeightNormal: '500',
                  fontWeightBold: '600',
                  colorBackground:
                    theme === 'dark' ? cssVariables.colors.base850 : cssVariables.colors.base0,
                  fontFamily: 'Inter, sans-serif',
                  colorTextPlaceholder: cssVariables.colors.base500,
                  colorIcon:
                    theme === 'dark' ? cssVariables.colors.base0 : cssVariables.colors.base1000,
                  borderRadius: '0px',
                  colorDanger: cssVariables.colors.error500,
                  colorDangerText: cssVariables.colors.error500,
                },
              },
            }}
          >
            <CheckoutForm />
          </Elements>
        </Fragment>
      )}
    </Fragment>
  )
}
