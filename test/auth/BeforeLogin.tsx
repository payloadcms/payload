'use client'

import { useConfig } from '@payloadcms/ui'

export const BeforeLogin = () => {
  const { config } = useConfig()

  return (
    <p
      id="unauthenticated-client-config"
      style={{ opacity: 0, pointerEvents: 'none', position: 'absolute' }}
    >
      {JSON.stringify(config, null, 2)}
    </p>
  )
}
