'use client'
import type { ReactSelectOption } from '@payloadcms/ui'

import { SelectInput } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import './index.scss'

function findValue(options: { label: string; value: string }[], value?: string) {
  return options.find((opt) => opt.value === value)?.value
}

export const TenantSelectorClient = ({
  cookieToSet,
  initialValue,
  options,
}: {
  cookieToSet?: string
  initialValue?: string
  options: {
    label: string
    value: string
  }[]
}) => {
  const [value, setValue] = React.useState<string | undefined>(() => {
    if (initialValue) {
      return findValue(options, initialValue)
    }
  })

  const router = useRouter()

  const setCookieAndReload = React.useCallback(
    (value?: string) => {
      const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
      document.cookie = 'payload-tenant=' + (value || '') + expires + '; path=/'
      setValue(value)
      router.refresh()
    },
    [router],
  )

  const handleChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (!option) {
        setCookieAndReload(undefined)
      } else if ('value' in option) {
        setCookieAndReload(option.value as string)
      }
    },
    [setCookieAndReload],
  )

  React.useEffect(() => {
    if (cookieToSet) {
      setCookieAndReload(findValue(options, cookieToSet))
    }
  }, [cookieToSet, options, setCookieAndReload])

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={false}
        label="Select a tenant"
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        readOnly={!value}
        value={value}
      />
    </div>
  )
}
