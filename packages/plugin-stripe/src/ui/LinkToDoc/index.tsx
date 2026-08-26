'use client'
import type { UIFieldClientComponent } from 'payload'

import { CopyToClipboard, FieldLabel, useFormFields } from '@payloadcms/ui'
import React from 'react'

import './index.css'

const baseClass = 'link-to-doc'

export const LinkToDoc: UIFieldClientComponent = (props) => {
  const {
    field: { admin: { custom = {} } = {} },
  } = props
  const { isTestKey, nameOfIDField, stripeResourceType } = custom

  const field = useFormFields(([fields]) => (fields && fields?.[nameOfIDField]) || null)
  const { value: stripeID } = field || {}

  if (!stripeID) {
    return null
  }

  const stripeEnv = isTestKey ? 'test/' : ''
  const href = `https://dashboard.stripe.com/${stripeEnv}${stripeResourceType}/${stripeID}`

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <FieldLabel htmlFor={baseClass} label="View in Stripe" />
        <CopyToClipboard value={href} />
      </div>
      <div className={`${baseClass}__url`}>
        <a href={href} rel="noopener noreferrer" target="_blank">
          {href}
        </a>
      </div>
    </div>
  )
}
