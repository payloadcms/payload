'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField, useFormModified } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.scss'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = (args: Props) => {
  const { options, selectedTenantID, setEntityType, setTenant } = useTenantSelection()
  const { value } = useField<number | string>()

  React.useEffect(() => {
    setEntityType(args.unique ? 'global' : 'document')

    if (!args.unique) {
      // unique documents are controlled from the global TenantSelector
      if (args.unique && !selectedTenantID) {
        // set default tenant for the global
        if (options.length > 0) {
          setTenant({ id: options[0]?.value, refresh: true })
        }
      } else if (value) {
        if (!selectedTenantID || value !== selectedTenantID) {
          setTenant({ id: value, refresh: Boolean(args.unique) })
        }
      }
    }

    return () => {
      setEntityType(undefined)
    }
  }, [args.unique, options, selectedTenantID, setTenant, value, setEntityType])

  if (options.length > 1 && !args.unique) {
    return (
      <>
        <div className={baseClass}>
          <div className={`${baseClass}__wrapper`}>
            <RelationshipField {...args} />
          </div>
        </div>
        <SyncFormModified />
      </>
    )
  } else if (args.unique) {
    return <SyncFormModified />
  }

  return null
}

const SyncFormModified = () => {
  const modified = useFormModified()
  const { setModified } = useTenantSelection()

  React.useEffect(() => {
    setModified(modified)
  }, [modified, setModified])

  return null
}
