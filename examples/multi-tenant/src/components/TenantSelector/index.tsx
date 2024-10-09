import { cookies as getCookies } from 'next/headers'
import React from 'react'

import { TenantSelector } from './index.client'

export const TenantSelectorRSC = async () => {
  const cookies = await getCookies()
  return <TenantSelector initialCookie={cookies.get('payload-tenant')?.value} />
}
