'use client'

import { CopyToClipboard, Link, useConfig, useField } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import './index.css'

const baseClass = 'link-to-doc'

export const LinkToDocClient: React.FC = () => {
  const { config } = useConfig()

  const {
    routes: {
      admin: adminRoute, // already includes leading slash
    },
    serverURL,
  } = config

  const { value } = useField<{ relationTo?: string; value?: string }>({ path: 'doc' })

  if (!value?.relationTo || !value?.value) {
    return null
  }

  const href = formatAdminURL({
    adminRoute,
    path: `/collections/${value.relationTo || ''}/${value.value || ''}`,
    serverURL,
  })

  return (
    <div className={baseClass}>
      <div>
        <span className={`label ${baseClass}__label`}>Doc URL</span>
        <CopyToClipboard value={href} />
      </div>
      <div className={`${baseClass}__url`}>
        <Link href={href} rel="noopener noreferrer" target="_blank">
          {href}
        </Link>
      </div>
    </div>
  )
}
