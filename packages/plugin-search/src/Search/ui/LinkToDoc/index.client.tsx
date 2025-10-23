'use client'

import { CopyToClipboard, Link, useConfig, useField } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

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

  const href = `${serverURL}${formatAdminURL({
    adminRoute,
    path: `/collections/${value.relationTo || ''}/${value.value || ''}`,
  })}`

  const hrefToDisplay = `${process.env.NEXT_BASE_PATH || ''}${href}`

  return (
    <div style={{ marginBottom: 'var(--spacing-field, 1rem)' }}>
      <div>
        <span
          className="label"
          style={{
            color: '#9A9A9A',
          }}
        >
          Doc URL
        </span>
        <CopyToClipboard value={hrefToDisplay} />
      </div>
      <div
        style={{
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <Link href={href} passHref {...{ rel: 'noopener noreferrer', target: '_blank' }}>
          {hrefToDisplay}
        </Link>
      </div>
    </div>
  )
}
