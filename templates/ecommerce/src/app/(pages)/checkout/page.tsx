import React from 'react'

import { fetchGlobals } from '../../cms'
import CheckoutPageClient from './page.client'

export default async function CheckoutPage() {
  const { settings } = await fetchGlobals()

  return <CheckoutPageClient settings={settings} />
}
