'use client'

import { AppHeader, SetStepNav, useConfig } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { useMemo } from 'react'

export function BreadcrumbCurrentPage() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const nav = useMemo(
    () => [
      {
        label: 'Parent section of breadcrumb example',
        url: formatAdminURL({ adminRoute }),
      },
      {
        isCurrent: true,
        label: 'Current breadcrumb example',
        url: formatAdminURL({ adminRoute, path: '/breadcrumb-current-page' }),
      },
      {
        isCurrent: false,
        label: 'Additional breadcrumb context',
      },
    ],
    [adminRoute],
  )

  return (
    <>
      <h1>Breadcrumb current-page example</h1>
      <SetStepNav nav={nav} />
      <AppHeader />
    </>
  )
}
