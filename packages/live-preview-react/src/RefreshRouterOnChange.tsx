'use client'

import type React from 'react'

export const RefreshRouterOnChange: React.FC<{
  router: any // TODO: Define router type, i.e. `next/navigation.js`, etc.
}> = ({ router }) => {
  // Listen for post message changes
  // Call `router.refresh()` when a change is detected
  if (
    router &&
    typeof router === 'object' &&
    'refresh' in router &&
    typeof router.refresh === 'function'
  ) {
    router.refresh()
  }

  return null
}
