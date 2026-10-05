'use client'

import type { ReactNode } from 'react'

import { useConfig } from '@payloadcms/ui'
import { useState } from 'react'

export const RootConfigProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useConfig()
  // Capture the layout config before PageConfigProvider updates it after hydration.
  const [initialConfig] = useState(config)

  return (
    <>
      <div hidden id="root-client-config">
        {JSON.stringify(initialConfig)}
      </div>
      {children}
    </>
  )
}
