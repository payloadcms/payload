'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.scss'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = (args: Props) => {
  const { options } = useTenantSelection()

  if (options.length > 1) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__wrapper`}>
          <RelationshipField {...args} />
        </div>
      </div>
    )
  }

  return null
}
