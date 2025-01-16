'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField } from '@payloadcms/ui'
import React from 'react'

import { SELECT_ALL } from '../../constants.js'
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
    if (!hasSetValueRef.current && value) {
      // set value on load
      setTenant({ id: value, refresh: unique })
      hasSetValueRef.current = true
    } else if (selectedTenantID && selectedTenantID === SELECT_ALL && options?.[0]?.value) {
      // in the document view, the tenant field should always have a value
      setTenant({ id: options[0].value, refresh: unique })
    } else if ((!value || value !== selectedTenantID) && selectedTenantID) {
      // Update the field value when the tenant is changed
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
