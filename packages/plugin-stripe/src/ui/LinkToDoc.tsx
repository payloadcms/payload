import type { UIField } from 'payload/dist/fields/config/types'

import { useFormFields } from 'payload/components/forms'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import React from 'react'

export const LinkToDoc: React.FC<
  UIField & {
    isTestKey: boolean
    nameOfIDField: string
    stripeResourceType: string
  }
> = (props) => {
  const { isTestKey, nameOfIDField, stripeResourceType } = props

  const field = useFormFields(([fields]) => fields[nameOfIDField])
  const { value: stripeID } = field || {}

  const stripeEnv = isTestKey ? 'test/' : ''
  const href = `https://dashboard.stripe.com/${stripeEnv}${stripeResourceType}/${stripeID}`

  if (stripeID) {
    return (
      <div>
        <div>
          <span
            className="label"
            style={{
              color: '#9A9A9A',
            }}
          >
            View in Stripe
          </span>
          <CopyToClipboard value={href} />
        </div>
        <div
          style={{
            fontWeight: '600',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <a href={href} rel="noreferrer noopener" target="_blank">
            {href}
          </a>
        </div>
      </div>
    )
  }

  return null
}
