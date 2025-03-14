'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { ViewTypes } from 'payload'

import './index.scss'

import { SelectInput, useTranslation } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'

export const TenantSelector = ({ label, viewType }: { label: string; viewType?: ViewTypes }) => {
  const { options, selectedTenantID, setTenant } = useTenantSelection()
  const { t } = useTranslation()

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
        label={t(label as any)}
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        value={selectedTenantID as string | undefined}
      />
    </div>
  )
}
