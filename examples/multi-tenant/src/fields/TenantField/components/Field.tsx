import type { Payload } from 'payload'

import { cookies as getCookies, headers as getHeaders } from 'next/headers'
import React from 'react'

import { TenantFieldComponentClient } from './Field.client'
import { userRole } from '@/collections/Users/roles'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'

export const TenantFieldComponent: React.FC<{
  path: string
  payload: Payload
  readOnly: boolean
}> = async (args) => {
  const cookies = await getCookies()
  const headers = await getHeaders()
  const { user } = await args.payload.auth({ headers })
  const tenantId = cookies.get(TENANT_COOKIE_NAME)
  const tenantIdNumber = tenantId ? Number.parseInt(tenantId.value, 10) : undefined

  if (
    user &&
    ((Array.isArray(user.tenants) && user.tenants.length > 1) ||
      user?.roles?.includes(userRole.SUPER_ADMIN))
  ) {
    return (
      <TenantFieldComponentClient
        initialValue={tenantIdNumber}
        path={args.path}
        readOnly={args.readOnly}
      />
    )
  }

  return null
}
