import React from 'react'

import { fetchGlobals } from '../../_api/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { getMeUser } from '../../_utilities/getMeUser'
import CheckoutPageClient from './CheckoutPage'

import classes from './index.module.scss'

export default async function CheckoutPage() {
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
