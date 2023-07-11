import React from 'react'

import { fetchGlobals } from '../../cms'
import { LogoutPageClient } from './page.client'

const LogoutPage = async () => {
  const { settings } = await fetchGlobals()

  return <LogoutPageClient settings={settings} />
}

export default LogoutPage
