import type { PayloadRequest } from '../../types/index.js'
import type { APIKeyAdministrationAccessConfig } from '../types.js'

import { describe, expect, it } from 'vitest'

import { canManageOthersAPIKeys, canReadOthersAPIKeys } from './access.js'

const alice = { id: '1', collection: 'customers' } as const

/**
 * A minimal `PayloadRequest` exposing only what `canReadOthersAPIKeys` /
 * `canManageOthersAPIKeys` read: the caller's own collection config (for its
 * `auth.useAPIKey.access` overrides and `access.admin` fallback) and `config.admin.user`.
 */
const buildReq = ({
  isAdmin = false,
  useAPIKeyAccess,
  userStrategy,
}: {
  isAdmin?: boolean
  useAPIKeyAccess?: APIKeyAdministrationAccessConfig
  userStrategy?: 'api-key'
} = {}): PayloadRequest =>
  ({
    payload: {
      collections: {
        [alice.collection]: {
          config: {
            access: { admin: () => isAdmin },
            auth: useAPIKeyAccess
              ? { useAPIKey: { access: useAPIKeyAccess, storage: 'collection' } }
              : undefined,
          },
        },
      },
      config: { admin: { user: 'admins' } },
    },
    user: userStrategy ? { ...alice, _strategy: userStrategy } : alice,
  }) as unknown as PayloadRequest

describe('canReadOthersAPIKeys / canManageOthersAPIKeys', () => {
  it('should default both to the access.admin result when no useAPIKey.access override is configured', async () => {
    const adminReq = buildReq({ isAdmin: true })
    await expect(canReadOthersAPIKeys({ req: adminReq })).resolves.toBe(true)
    await expect(canManageOthersAPIKeys({ req: adminReq })).resolves.toBe(true)

    const nonAdminReq = buildReq({ isAdmin: false })
    await expect(canReadOthersAPIKeys({ req: nonAdminReq })).resolves.toBe(false)
    await expect(canManageOthersAPIKeys({ req: nonAdminReq })).resolves.toBe(false)
  })

  it('should let readOthers grant read without granting manage', async () => {
    const req = buildReq({ isAdmin: false, useAPIKeyAccess: { readOthers: () => true } })

    await expect(canReadOthersAPIKeys({ req })).resolves.toBe(true)
    await expect(canManageOthersAPIKeys({ req })).resolves.toBe(false)
  })

  it('should let manageOthers grant read even when readOthers is not configured', async () => {
    const req = buildReq({ isAdmin: false, useAPIKeyAccess: { manageOthers: () => true } })

    await expect(canReadOthersAPIKeys({ req })).resolves.toBe(true)
    await expect(canManageOthersAPIKeys({ req })).resolves.toBe(true)
  })

  it('should evaluate readOthers and manageOthers independently when both are configured', async () => {
    const req = buildReq({
      isAdmin: false,
      useAPIKeyAccess: { manageOthers: () => false, readOthers: () => true },
    })

    await expect(canReadOthersAPIKeys({ req })).resolves.toBe(true)
    await expect(canManageOthersAPIKeys({ req })).resolves.toBe(false)
  })

  it('should reject an API-key-authenticated caller regardless of configuration', async () => {
    const req = buildReq({
      isAdmin: true,
      useAPIKeyAccess: { manageOthers: () => true, readOthers: () => true },
      userStrategy: 'api-key',
    })

    await expect(canReadOthersAPIKeys({ req })).resolves.toBe(false)
    await expect(canManageOthersAPIKeys({ req })).resolves.toBe(false)
  })

  it('should reject an unauthenticated caller', async () => {
    const req = { payload: { collections: {}, config: { admin: { user: 'admins' } } }, user: null }

    await expect(canReadOthersAPIKeys({ req: req as unknown as PayloadRequest })).resolves.toBe(
      false,
    )
    await expect(canManageOthersAPIKeys({ req: req as unknown as PayloadRequest })).resolves.toBe(
      false,
    )
  })
})
