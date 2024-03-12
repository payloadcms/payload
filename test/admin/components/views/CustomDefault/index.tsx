import type { AdminViewProps } from 'payload/types.js'

import { DefaultTemplate } from '@payloadcms/ui'
import { redirect } from 'next/navigation.js'
import React from 'react'

import { CustomDefaultViewClient } from './index.client.js'

export const CustomDefaultView: React.FC<AdminViewProps> = ({ initPageResult }) => {
  const {
    permissions,
    req: {
      i18n,
      payload: {
        config,
        config: {
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !permissions?.canAccessAdmin)) {
    return redirect(`${adminRoute}/unauthorized`)
  }

  return (
    <DefaultTemplate config={config} i18n={i18n} permissions={permissions} user={user}>
      <CustomDefaultViewClient />
    </DefaultTemplate>
  )
}
