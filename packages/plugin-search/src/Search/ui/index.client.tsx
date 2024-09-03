'use client'

import { useConfig } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import React from 'react'
// TODO: fix this import to work in dev mode within the monorepo in a way that is backwards compatible with 1.x
// import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'

export const LinkToDocClient: React.FC = () => {
  const { config } = useConfig()

  const {
    routes: {
      admin: adminRoute, // already includes leading slash
    },
    serverURL,
  } = config

  const href = `${serverURL}${formatAdminURL({
    adminRoute,
    path: '/collections/${relationTo}/${docId}',
  })}`

  return (
    <div>
      <div>
        <span
          className="label"
          style={{
            color: '#9A9A9A',
          }}
        >
          Doc URL
        </span>
        {/* <CopyToClipboard value={href} /> */}
      </div>
      <div
        style={{
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <a href={href}>{href}</a>
      </div>
    </div>
  )
}
