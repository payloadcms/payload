'use client'
import type { Option } from '@payloadcms/ui/elements/ReactSelect'
import type { OptionObject } from 'payload'

import { getTenantAdminTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { SelectInput, useAuth } from '@payloadcms/ui'
import * as qs from 'qs-esm'
import React from 'react'

import type { Tenant, User } from '../../payload-types'

import './index.scss'

export const TenantSelector = ({ initialCookie }: { initialCookie?: string }) => {
  const { user } = useAuth<User>()
  const [options, setOptions] = React.useState<OptionObject[]>([])

  const isSuperAdmin = user?.roles?.includes('super-admin')
  const tenantIDs =
    user?.tenants?.map(({ tenant }) => {
      if (tenant) {
        if (typeof tenant === 'string') {
          return tenant
        }
        return tenant.id
      }
    }) || []

  function setCookie(name: string, value?: string) {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = name + '=' + (value || '') + expires + '; path=/'
  }

  const handleChange = React.useCallback((option: Option | Option[]) => {
    if (!option) {
      setCookie('payload-tenant', undefined)
      window.location.reload()
    } else if ('value' in option) {
      setCookie('payload-tenant', option.value as string)
      window.location.reload()
    }
  }, [])

  React.useEffect(() => {
    const fetchTenants = async () => {
      const adminOfTenants = getTenantAdminTenantAccessIDs(user ?? null)

      const queryString = qs.stringify(
        {
          depth: 0,
          limit: 100,
          sort: 'name',
          where: {
            id: {
              in: adminOfTenants,
            },
          },
        },
        {
          addQueryPrefix: true,
        },
      )

      const res = await fetch(`/api/tenants${queryString}`, {
        credentials: 'include',
      }).then((res) => res.json())

      const optionsToSet = res.docs.map((doc: Tenant) => ({ label: doc.name, value: doc.id }))

      if (optionsToSet.length === 1) {
        setCookie('payload-tenant', optionsToSet[0].value)
      }
      setOptions(optionsToSet)
    }

    if (user) {
      void fetchTenants()
    }
  }, [user])

  if ((isSuperAdmin || tenantIDs.length > 1) && options.length > 1) {
    return (
      <div className="tenant-selector">
        <SelectInput
          label="Select a tenant"
          name="setTenant"
          onChange={handleChange}
          options={options}
          path="setTenant"
          value={options.find((opt) => opt.value === initialCookie)?.value}
        />
      </div>
    )
  }

  return null
}
