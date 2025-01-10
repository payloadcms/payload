'use client'
import type { ReactSelectOption } from '@payloadcms/ui'

import { SelectInput } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.js'
import './index.scss'

export const TenantSelectorClient = ({
  initialValue,
  options,
}: {
  initialValue?: string
  options: {
    label: string
    value: string
  }[]
}) => {
  const { selectedTenantID, setTenant } = useTenantSelection()

  const handleChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if ('value' in option) {
        setTenant(option.value as string, 'document', true)
      }
    },
    [setTenant],
  )

  React.useEffect(() => {
    // this runs if the user has no cookie set
    if (!selectedTenantID && initialValue) {
      setTenant(initialValue, 'cookie', true)
    }
  }, [initialValue, setTenant, selectedTenantID])

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={false}
        label="Tenant"
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        // readOnly={!value}
        value={selectedTenantID ? String(selectedTenantID) : undefined}
      />
    </div>
  )
}
