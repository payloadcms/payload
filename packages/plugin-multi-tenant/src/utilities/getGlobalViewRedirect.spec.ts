import type { Payload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { getGlobalViewRedirect } from './getGlobalViewRedirect.js'

vi.mock('./getTenantOptions.js', () => ({
  getTenantOptions: vi.fn().mockResolvedValue([{ label: 'Tenant', value: 'tenant-1' }]),
}))

describe('getGlobalViewRedirect', () => {
  it('should create autosave drafts with the configured tenant field', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'draft-1' })
    const payload = {
      collections: {
        tenants: { customIDType: 'text', config: {} },
        'global-content': {
          config: {
            versions: {
              drafts: {
                autosave: { interval: 1000 },
              },
            },
          },
        },
      },
      config: {
        routes: { admin: '/admin' },
        serverURL: 'http://localhost:3000',
      },
      create,
      db: { defaultIDType: 'text' },
      find: vi.fn().mockResolvedValue({ docs: [] }),
      logger: { error: vi.fn() },
    } as unknown as Payload

    await getGlobalViewRedirect({
      headers: new Headers(),
      payload,
      slug: 'global-content',
      tenantFieldName: 'organization',
      tenantsArrayFieldName: 'tenants',
      tenantsArrayTenantFieldName: 'tenant',
      tenantsCollectionSlug: 'tenants',
      useAsTitle: 'name',
      user: { id: 'user-1' } as never,
      userHasAccessToAllTenants: () => true,
      view: 'list',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'global-content',
        data: { organization: 'tenant-1' },
        draft: true,
      }),
    )
  })
})
