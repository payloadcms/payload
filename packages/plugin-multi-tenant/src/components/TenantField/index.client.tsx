'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { SELECT_ALL } from '../../constants.js'
import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.js'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = (args: Props) => {
  const { debug, path, unique } = args
  const { setValue, value } = useField<number | string>({ path })
  const { options, selectedTenantID, setRefreshOnChange, setTenant } = useTenantSelection()

  React.useEffect(() => {
    if (!selectedTenantID && value) {
      // Initialize the tenant selector with the field value
      setTenant({ id: value, from: 'document' })
    } else if (selectedTenantID && selectedTenantID === SELECT_ALL && options?.[0]?.value) {
      setTenant({ id: options[0].value, from: 'document' })
    } else if ((!value || value !== selectedTenantID) && selectedTenantID) {
      // Update the field value when the tenant is changed
      setValue(selectedTenantID)
    }
  }, [value, selectedTenantID, setTenant, setValue, options])

  React.useEffect(() => {
    if (!unique) {
      setRefreshOnChange(false)
    }

    return () => {
      if (!unique) {
        setRefreshOnChange(true)
      }
    }
  }, [setRefreshOnChange, unique])

  if (debug) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__wrapper`}>
          <RelationshipField {...args} />
        </div>
        <div className={`${baseClass}__hr`} />
      </div>
    )
  }

  return null
}
