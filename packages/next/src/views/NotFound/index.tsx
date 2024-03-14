import type { AdminViewComponent } from 'payload/types'

import { DefaultTemplate } from '@payloadcms/ui'
import React from 'react'

import { NotFoundClient } from './index.client.js'

export const NotFoundView: AdminViewComponent = ({ initPageResult }) => {
  return (
    <DefaultTemplate
      config={initPageResult?.req?.payload.config}
      i18n={initPageResult?.req?.i18n}
      permissions={initPageResult?.permissions}
      user={initPageResult?.req?.user}
    >
      <NotFoundClient />
    </DefaultTemplate>
  )
}
