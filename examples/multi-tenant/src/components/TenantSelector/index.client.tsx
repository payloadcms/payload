'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Option } from '@payloadcms/ui/elements/ReactSelect'
import { SelectInput, useAuth } from '@payloadcms/ui'
import type { OptionObject } from 'payload'
import * as qs from 'qs-esm'

import type { Tenant, User } from '@/payload-types'
import { getTenantAdminTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'
import { userRole } from '@/collections/Users/roles'
import { extractID } from '@/utilities/extractID'

import './index.scss'

export const TenantSelector = ({ initialCookie }: { initialCookie?: string }) => {
  const { user } = useAuth<User>()
  const [options, setOptions] = useState<OptionObject[]>([])

  const isSuperAdmin = user?.roles?.includes(userRole.SUPER_ADMIN)
  const tenantIDs =
    user?.tenants?.map(({ tenant }) => {
      if (tenant) {
        return extractID(tenant)
      }
    }) || []

  function setCookie(name: string, value?: string) {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = name + '=' + (value || '') + expires + '; path=/'
  }

  const handleChange = useCallback((option: Option | Option[]) => {
    if (!option) {
      setCookie(TENANT_COOKIE_NAME, undefined)
      window.location.reload()
    } else if ('value' in option) {
      setCookie(TENANT_COOKIE_NAME, option.value as string)
      window.location.reload()
    }
  }, [])

  useEffect(() => {
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

      const optionsToSet = res.docs.map((doc: Tenant) => ({
        label: doc.name,
        value: doc.id,
      }))

      if (optionsToSet.length === 1) {
        setCookie(TENANT_COOKIE_NAME, optionsToSet[0].value)
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
