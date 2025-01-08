import { cookies as getCookies } from 'next/headers'
import React from 'react'

import { TenantSelector } from './index.client'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'

export const TenantSelectorRSC = async () => {
  const cookies = await getCookies()
  return <TenantSelector initialCookie={cookies.get(TENANT_COOKIE_NAME)?.value} />
}
