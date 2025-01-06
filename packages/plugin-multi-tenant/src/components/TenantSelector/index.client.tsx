'use client'
import type { ReactSelectOption } from '@payloadcms/ui'

import { SelectInput } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

export const TenantSelector = ({
  initialValue,
  options,
}: {
  initialValue?: string
  options: {
    label: string
    value: string
  }[]
}) => {
  function setCookie(name: string, value?: string) {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = name + '=' + (value || '') + expires + '; path=/'
  }

  const handleChange = React.useCallback((option: ReactSelectOption | ReactSelectOption[]) => {
    if (!option) {
      setCookie('payload-tenant', undefined)
      window.location.reload()
    } else if ('value' in option) {
      setCookie('payload-tenant', option.value as string)
      window.location.reload()
    }
  }, [])

  return (
    <div className="tenant-selector">
      <SelectInput
        label="Select a tenant"
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        value={options.find((opt) => opt.value === initialValue)?.value}
      />
    </div>
  )
}
