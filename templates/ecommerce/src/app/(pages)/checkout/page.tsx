import React from 'react'
import { Metadata } from 'next'

import { fetchGlobals } from '../../_api/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { getMeUser } from '../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import CheckoutPageClient from './CheckoutPage'

import classes from './index.module.scss'

export default async function Checkout() {
  await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to checkout.',
    )}&redirect=${encodeURIComponent('/checkout')}`,
  })

  const { settings } = await fetchGlobals()

  return (
    <Gutter className={classes.checkoutPage}>
      <h1>Checkout</h1>
      <p>
        This is a self-hosted, secure checkout using Stripe&apos;s Payment Element component. Use
        credit card number <b>4242 4242 4242 4242</b> with any future date and CVC to create a mock
        purchase. An order will be generated in the CMS and will appear in your account.
      </p>
      <CheckoutPageClient settings={settings} />
    </Gutter>
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
