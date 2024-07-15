'use client'
import type { Option } from '@payloadcms/ui/elements/ReactSelect'
import type { OptionObject } from 'payload'

import { SelectInput, useAuth } from '@payloadcms/ui'
import React from 'react'

import type { Tenant, User } from '../../../payload-types.js'

import './index.scss'

export const TenantSelector = ({ initialCookie }: { initialCookie?: string }) => {
  const { user } = useAuth<User>()
  const [options, setOptions] = React.useState<OptionObject[]>([])
  const [value, setValue] = React.useState<string | undefined>(initialCookie)

  const isSuperAdmin = user?.roles?.includes('super-admin')
  const tenantIDs =
    user?.tenants?.map(({ tenant }) => {
      if (tenant) {
        if (typeof tenant === 'string') return tenant
        return tenant.id
      }
    }) || []

  function setCookie(name: string, value?: string) {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = name + '=' + (value || '') + expires + '; path=/'
  }

  React.useEffect(() => {
    const fetchTenants = async () => {
      const res = await fetch(`/api/tenants?depth=0&limit=100&sort=name`, {
        credentials: 'include',
      }).then((res) => res.json())

      setOptions(res.docs.map((doc: Tenant) => ({ label: doc.name, value: doc.id })))
    }

    void fetchTenants()
  }, [])

  const handleChange = React.useCallback((option: Option | Option[]) => {
    if (!option) {
      setCookie('payload-tenant', undefined)
      window.location.reload()
    } else if ('value' in option) {
      setCookie('payload-tenant', option.value as string)
      window.location.reload()
    }
  }, [])

  if (isSuperAdmin || tenantIDs.length > 1) {
    return (
      <div className="tenant-selector">
        <SelectInput
          label="Select a tenant"
          name="setTenant"
          onChange={handleChange}
          options={options}
          path="setTenant"
          value={value}
        />
      </div>
    )
  }

  return null
}
