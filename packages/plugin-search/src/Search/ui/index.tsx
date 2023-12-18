import type { Fields } from 'payload/dist/admin/components/forms/Form/types'
import type { UIField } from 'payload/dist/fields/config/types'

import { useWatchForm } from 'payload/components/forms'
import { useConfig } from 'payload/components/utilities'
// TODO: fix this import to work in dev mode within the monorepo in a way that is backwards compatible with 1.x
// import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import React from 'react'

type FieldsWithDoc = Fields & {
  doc: {
    value: {
      relationTo: string
      value: string
    }
  }
}

export const LinkToDoc: React.FC<UIField> = () => {
  const form = useWatchForm()
  const fields = form.fields as FieldsWithDoc

  const {
    doc: {
      value: { relationTo, value: docId },
    },
  } = fields

  const config = useConfig()

  const {
    routes: {
      admin: adminRoute, // already includes leading slash
    } = {},
    serverURL,
  } = config

  const href = `${serverURL}${adminRoute}/collections/${relationTo}/${docId}`

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
