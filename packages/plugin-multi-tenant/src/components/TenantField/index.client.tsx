'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.scss'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = (args: Props) => {
  const { debug, path, unique } = args
  const { setValue, value } = useField<number | string>({ path })
  const { options, selectedTenantID, setPreventRefreshOnChange, setTenant } = useTenantSelection()

  const hasSetValueRef = React.useRef(false)

  React.useEffect(() => {
    if (!hasSetValueRef.current) {
      // set value on load
      if (value && value !== selectedTenantID) {
        setTenant({ id: value, refresh: unique })
      } else {
        // in the document view, the tenant field should always have a value
        const defaultValue = selectedTenantID || options[0]?.value
        setTenant({ id: defaultValue, refresh: unique })
      }
      hasSetValueRef.current = true
    } else if (!value || value !== selectedTenantID) {
      // Update the field on the document value when the tenant is changed
      setValue(selectedTenantID)
    }
  }, [value, selectedTenantID, setTenant, setValue, options, unique])

  React.useEffect(() => {
    if (!unique) {
      setPreventRefreshOnChange(true)
    }
    return () => {
      setPreventRefreshOnChange(false)
    }
  }, [unique, setPreventRefreshOnChange])

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
