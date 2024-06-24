'use client'
import type { CustomComponent } from 'payload/config'
import type { UIField } from 'payload/types'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
// import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import { useFormFields } from '@payloadcms/ui/forms/Form'
import React from 'react'

export const LinkToDoc: CustomComponent<UIField> = () => {
  const { custom } = useFieldProps()
  const { isTestKey, nameOfIDField, stripeResourceType } = custom

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
          {/* <CopyToClipboard value={href} /> */}
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
