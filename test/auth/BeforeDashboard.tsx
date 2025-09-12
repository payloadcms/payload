'use client'

import { useConfig } from '@payloadcms/ui'

export const BeforeDashboard = () => {
  const { config } = useConfig()

  return (
    <p
      id="authenticated-client-config"
      style={{ opacity: 0, pointerEvents: 'none', position: 'absolute' }}
    >
      {JSON.stringify(config, null, 2)}
    </p>
  )
}
