import React, { Fragment } from 'react'
import { Metadata } from 'next'

import { fetchGlobals } from '../../_api/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { Message } from '../../_components/Message'
import { getMeUser } from '../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import { CheckoutPage } from './CheckoutPage'

import classes from './index.module.scss'

export default async function Checkout() {
  await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to checkout.',
    )}&redirect=${encodeURIComponent('/checkout')}`,
  })

  const { settings } = await fetchGlobals()

  return (
    <Fragment>
      {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <Gutter>
          <Message
            className={classes.message}
            warning={
              <Fragment>
                {'To enable checkout, you must '}
                <a
                  href="https://dashboard.stripe.com/test/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'obtain your Stripe API Keys'}
                </a>
                {' then set them as environment variables. See the '}
                <a
                  href="https://github.com/payloadcms/payload/blob/master/templates/ecommerce/README.md#stripe"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'README'}
                </a>
                {' for more details.'}
              </Fragment>
            }
          />
        </Gutter>
      )}
      <Gutter className={classes.checkoutPage}>
        <h1>Checkout</h1>
        <p>
          This is a self-hosted, secure checkout using Stripe&apos;s Payment Element component. Use
          credit card number <b>4242 4242 4242 4242</b> with any future date and CVC to create a
          mock purchase. An order will be generated in the CMS and will appear in your account.
        </p>
        <CheckoutPage settings={settings} />
      </Gutter>
    </Fragment>
  )
}

export const metadata: Metadata = {
  title: 'Account',
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
}
