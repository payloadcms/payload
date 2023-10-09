import React, { Fragment } from 'react'
import { Metadata } from 'next'

import { Settings } from '../../../payload/payload-types'
import { fetchSettings } from '../../_api/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { Message } from '../../_components/Message'
import { LowImpactHero } from '../../_heros/LowImpact'
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

  let settings: Settings | null = null

  try {
    settings = await fetchSettings()
  } catch (error) {
    // no need to redirect to 404 here, just simply render the page with fallback data where necessary
    console.error(error) // eslint-disable-line no-console
  }

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
                  href="https://github.com/payloadcms/payload/blob/main/templates/ecommerce/README.md#stripe"
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
      <LowImpactHero
        type="lowImpact"
        media={null}
        richText={[
          {
            type: 'h1',
            children: [
              {
                text: 'Checkout',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                text: `This is a self-hosted, secure checkout using Stripe's Payment Element component. To create a mock purchase, use a `,
              },
              {
                type: 'link',
                url: 'https://stripe.com/docs/testing#cards',
                children: [
                  {
                    text: 'test credit card',
                  },
                ],
              },
              {
                text: ' like ',
              },
              {
                text: '4242 4242 4242 4242',
                bold: true,
              },
              {
                text: ' with any future date and CVC. An order will be generated in Stripe and will appear in your account. In production, this checkout form will require a real card with sufficient funds.',
              },
            ],
          },
        ]}
      />
      <Gutter className={classes.checkoutPage}>
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
