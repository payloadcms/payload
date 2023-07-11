import React from 'react'

import { Page } from '../../../payload-types'
import { fetchDoc, fetchGlobals } from '../../cms'
import { CartPageClient } from './page.client'

const CartPage = async () => {
  const { settings } = await fetchGlobals()
  const page = await fetchDoc<Page>('pages', 'cart')

  return <CartPageClient settings={settings} page={page} />
}

export default CartPage
