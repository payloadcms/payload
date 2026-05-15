import type { AuthStrategy } from 'payload'

export const OVOK_INTERNAL_KEY_HEADER = 'x-ovok-internal-key'
export const OVOK_TENANT_HEADER = 'x-ovok-tenant-id'

/**
 * Trust-the-proxy auth strategy.
 *
 * The Ovok NestJS backend is the only allowed caller. It has already
 * validated the Medplum JWT and the project's `content-enabled` setting.
 * We trust it by checking a shared secret header, then take the tenant
 * ID from a second header injected by the same proxy.
 *
 * The synthetic user returned here is throwaway — Payload's user concept
 * is not used for authorisation; the multi-tenant plugin handles scoping
 * via the tenant field on every collection.
 */
export const ovokInternalStrategy: AuthStrategy = {
  name: 'ovok-internal',
  authenticate: async ({ headers }) => {
    const presentedKey = headers.get(OVOK_INTERNAL_KEY_HEADER)
    const expectedKey = process.env.PAYLOAD_INTERNAL_API_KEY
    if (!expectedKey || presentedKey !== expectedKey) {
      return { user: null }
    }

    const tenantId = headers.get(OVOK_TENANT_HEADER)
    if (!tenantId) {
      return { user: null }
    }

    return {
      user: {
        id: `ovok-proxy:${tenantId}`,
        collection: 'users',
        email: 'proxy@ovok.local',
        tenants: [{ tenant: tenantId }],
      },
    }
  },
}
