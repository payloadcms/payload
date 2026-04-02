import { LogoutClient } from '@payloadcms/ui'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function LogoutView({ pageState }: { pageState: SerializablePageState }) {
  return (
    <div className="logout">
      <LogoutClient
        adminRoute={pageState.clientConfig.routes.admin}
        inactivity={pageState.segments[0] === 'inactivity'}
        redirect={String(pageState.searchParams?.redirect || '')}
      />
    </div>
  )
}
