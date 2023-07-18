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
    nullUserRedirect: `/login?error=${encodeURIComponent('You must be logged in to checkout.')}`,
  })

  const { settings } = await fetchGlobals()

  return (
    <Gutter className={classes.checkoutPage}>
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
