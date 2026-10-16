'use client'

import { useConfig } from '@payloadcms/ui'
import React, { useState } from 'react'

/**
 * A custom client component, compiled by the admin runtime. It reads the admin's config context, which
 * only works if it shares the runtime's React and `@payloadcms/ui` instances.
 */
export const ClickCounter = () => {
  const { config } = useConfig()
  const [clicks, setClicks] = useState(0)

  return (
    <button id="admin-runtime-client-component" onClick={() => setClicks(clicks + 1)} type="button">
      {config.routes.admin}: {clicks} clicks
    </button>
  )
}
