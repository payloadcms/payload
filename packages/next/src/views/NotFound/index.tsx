import type { AdminViewComponent } from 'payload/types'

import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import React from 'react'

import { NotFoundClient } from './index.client.js'

export const NotFoundView: AdminViewComponent = ({ initPageResult }) => {
  return (
    <DefaultTemplate config={initPageResult?.req?.payload.config}>
      <NotFoundClient />
    </DefaultTemplate>
  )
}
