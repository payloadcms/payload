import type { Payload } from 'payload'
import { type FC } from 'react'
import { cookies as getCookies, headers as getHeaders } from 'next/headers'

import { TenantFieldComponentClient } from './Field.client'
import { userRole } from '@/collections/Users/roles'

export const TenantFieldComponent: FC<{
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
      user?.roles?.includes(userRole.SUPER_ADMIN))
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
