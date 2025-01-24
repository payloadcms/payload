'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { ViewTypes } from 'payload'

import { SelectInput } from '@payloadcms/ui'

import './index.scss'

import React from 'react'

import { SELECT_ALL } from '../../constants.js'
import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'

export const TenantSelector = ({ viewType }: { viewType?: ViewTypes }) => {
  const { options, selectedTenantID, setTenant } = useTenantSelection()

  const handleChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (option && 'value' in option) {
        setTenant({ id: option.value as string, refresh: true })
      } else {
        setTenant({ id: undefined, refresh: true })
      }
    },
    [setTenant],
  )

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={viewType === 'list'}
        label="Tenant"
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        value={
          selectedTenantID
            ? selectedTenantID === SELECT_ALL
              ? undefined
              : String(selectedTenantID)
            : undefined
        }
      />
    </div>
  )
}
