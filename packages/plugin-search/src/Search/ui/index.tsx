import React from 'react'
import { useWatchForm } from 'payload/components/forms'
import { useConfig } from 'payload/components/utilities'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import { Fields } from 'payload/dist/admin/components/forms/Form/types'
import { UIField } from 'payload/dist/fields/config/types'

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
    serverURL,
    routes: {
      admin: adminRoute, // already includes leading slash
    } = {},
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
        <CopyToClipboard value={href as string} />
      </div>
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: '600',
        }}
      >
        <a href={href as string}>{href}</a>
      </div>
    </div>
  )
}
