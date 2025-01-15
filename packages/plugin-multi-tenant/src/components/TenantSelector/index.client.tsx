'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { OptionObject } from 'payload'

import { SelectInput } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { SELECT_ALL } from '../../constants.js'
import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.js'

export const TenantSelectorClient = ({
  initialValue,
  options,
}: {
  initialValue?: string
  options: OptionObject[]
}) => {
  const { selectedTenantID, setOptions, setTenant } = useTenantSelection()

  const handleChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (option && 'value' in option) {
        setTenant({ id: option.value as string, from: 'document', refresh: true })
      } else {
        setTenant({ id: undefined, from: 'document', refresh: true })
      }
    },
    [setTenant],
  )

  React.useEffect(() => {
    if (!selectedTenantID && initialValue) {
      setTenant({ id: initialValue, from: 'cookie', refresh: true })
    } else if (selectedTenantID && !options.find((option) => option.value === selectedTenantID)) {
      if (options?.[0]?.value) {
        // this runs if the user has a selected value that is no longer a valid option
        setTenant({ id: options[0].value, from: 'document', refresh: true })
      } else {
        setTenant({ id: undefined, from: 'document', refresh: true })
      }
    }
  }, [initialValue, setTenant, selectedTenantID, options])

  React.useEffect(() => {
    setOptions(options)
  }, [options, setOptions])

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
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
