import type { RelationshipFieldServerProps } from 'payload'

import React from 'react'

import type { UserWithTenantsField } from '../../types.js'

import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'
import { TenantFieldClient } from './index.client.js'

type Props = {
  debug?: boolean
  tenantsCollectionSlug: string
} & RelationshipFieldServerProps

export const TenantField: React.FC = async ({
  clientField,
  debug,
  path,
  payload,
  readOnly,
  req,
  tenantsCollectionSlug,
  user,
}: Props) => {
  let serverValue: number | string | undefined =
    getTenantFromCookie(req.headers) || getUserTenantIDs(user as UserWithTenantsField)?.[0]

  if (serverValue) {
    try {
      // validate that the tenant exists
      const doc = await payload.findByID({
        id: serverValue,
        collection: tenantsCollectionSlug,
        depth: 0,
      })
      if (!doc) {
        serverValue = undefined
      }
    } catch (_) {
      serverValue = undefined
    }
  }

  return (
    <TenantFieldClient
      debug={debug}
      field={clientField}
      path={path}
      readOnly={readOnly}
      serverValue={serverValue}
      tenantsCollectionSlug={tenantsCollectionSlug}
    />
  )
}
