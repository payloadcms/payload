import type { RelationshipFieldServerProps } from 'payload'

import React from 'react'

import type { UserWithTenantsField } from '../../types.js'

import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'
import { TenantFieldClient } from './index.client.js'

export const TenantField: React.FC = async ({
  clientField,
  path,
  payload,
  readOnly,
  req,
  user,
}: RelationshipFieldServerProps) => {
  let serverValue: number | string | undefined =
    getTenantFromCookie(req.headers) || getUserTenantIDs(user as UserWithTenantsField)?.[0]

  if (serverValue) {
    try {
      // validate that the tenant exists
      const doc = await payload.findByID({
        id: serverValue,
        collection: 'tenants',
        depth: 0,
      })
      if (!doc) {
        serverValue = undefined
      }
    } catch (e) {
      serverValue = undefined
    }
  }

  return (
    <TenantFieldClient
      field={clientField}
      path={path}
      readOnly={readOnly}
      serverValue={serverValue}
    />
  )
}
