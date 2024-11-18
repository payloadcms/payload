import type { Payload } from 'payload'

import { cookies as getCookies, headers as getHeaders } from 'next/headers'
import React from 'react'

import { TenantFieldComponentClient } from './Field.client'

export const TenantFieldComponent: React.FC<{
  path: string
  payload: Payload
  readOnly: boolean
}> = async (args) => {
  const cookies = await getCookies()
  const headers = await getHeaders()
  const { user } = await args.payload.auth({ headers })

  if (
    user &&
    ((Array.isArray(user.tenants) && user.tenants.length > 1) ||
      user?.roles?.includes('super-admin'))
  ) {
    return (
      <TenantFieldComponentClient
        initialValue={cookies.get('payload-tenant')?.value || undefined}
        path={args.path}
        readOnly={args.readOnly}
      />
    )
  }

  return null
}
