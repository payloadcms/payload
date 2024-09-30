'use client'
import type { CustomComponent, PayloadClientReactComponent } from 'payload'

import { CopyToClipboard, useFieldProps, useFormFields } from '@payloadcms/ui'
import React from 'react'

export const LinkToDoc: PayloadClientReactComponent<CustomComponent> = () => {
  const { custom } = useFieldProps()
  const { isTestKey, nameOfIDField, stripeResourceType } = custom

  const field = useFormFields(([fields]) => (fields && fields?.[nameOfIDField]) || null)
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
