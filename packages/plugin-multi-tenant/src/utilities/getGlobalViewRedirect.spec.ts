import type { Payload, ServerAdapter } from 'payload'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getGlobalViewRedirect } from './getGlobalViewRedirect.js'

const { getTenantOptions } = vi.hoisted(() => ({ getTenantOptions: vi.fn() }))

vi.mock('./getTenantOptions.js', () => ({ getTenantOptions }))

const find = vi.fn()
const create = vi.fn()
const payload = {
  collections: { tenants: { customIDType: 'text' }, menus: { config: {} } },
  config: { routes: { admin: '/admin' }, serverURL: '' },
  db: { defaultIDType: 'text' },
  find,
  create,
  logger: { error: vi.fn() },
} as unknown as Payload
const args = {
  slug: 'menus',
  headers: new Headers(),
  payload,
  server: { unauthorized: vi.fn() } as unknown as ServerAdapter,
  tenantFieldName: 'tenant',
  tenantsArrayFieldName: 'tenants',
  tenantsArrayTenantFieldName: 'tenant',
  tenantsCollectionSlug: 'tenants',
  useAsTitle: 'name',
  user: { id: 'admin', collection: 'users' },
  userHasAccessToAllTenants: () => true,
  view: 'list' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  getTenantOptions.mockResolvedValue([
    { label: 'Tenant A', value: 'a' },
    { label: 'Tenant B', value: 'b' },
  ])
  find.mockResolvedValue({ docs: [{ id: 'menu-a', tenant: 'a' }] })
})

describe('global browsing redirects', () => {
  test('should show the global list when All tenants is selected', async () => {
    expect(await getGlobalViewRedirect(args)).toBeUndefined()
    expect(find).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  test('should show the global list even when a document cookie remains', async () => {
    expect(
      await getGlobalViewRedirect({
        ...args,
        headers: new Headers({ cookie: 'payload-tenant=b; payload-tenant-filter=' }),
      }),
    ).toBeUndefined()
    expect(find).not.toHaveBeenCalled()
  })

  test('should retain automatic global navigation for an ordinary single-tenant member', async () => {
    getTenantOptions.mockResolvedValue([{ label: 'Tenant A', value: 'a' }])

    expect(
      await getGlobalViewRedirect({
        ...args,
        userHasAccessToAllTenants: () => false,
      }),
    ).toBe('/admin/collections/menus/menu-a')
  })

  test('should retain an accessible document link despite a different browsing tenant', async () => {
    expect(
      await getGlobalViewRedirect({
        ...args,
        docID: 'menu-a',
        headers: new Headers({ cookie: 'payload-tenant=b' }),
        view: 'document',
      }),
    ).toBeUndefined()
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: false,
        user: args.user,
        where: { and: [{ id: { equals: 'menu-a' } }, { tenant: { in: ['a', 'b'] } }] },
      }),
    )
  })

  test('should redirect a selected tenant list to its global', async () => {
    expect(
      await getGlobalViewRedirect({
        ...args,
        headers: new Headers({ cookie: 'payload-tenant=a' }),
      }),
    ).toBe('/admin/collections/menus/menu-a')
  })

  test('should retain a direct link with a numeric document ID of zero', async () => {
    find.mockResolvedValue({ docs: [{ id: 0, tenant: 'a' }] })

    expect(await getGlobalViewRedirect({ ...args, docID: 0, view: 'document' })).toBeUndefined()
  })

  test('should retain the available-tenant fallback for an invalid cookie', async () => {
    expect(
      await getGlobalViewRedirect({
        ...args,
        headers: new Headers({ cookie: 'payload-tenant=inaccessible' }),
      }),
    ).toBe('/admin/collections/menus/menu-a')
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: { tenant: { in: ['a'] } } }))
  })

  test('should send a create route without a selected tenant back to the global list', async () => {
    expect(await getGlobalViewRedirect({ ...args, view: 'document' })).toBe(
      '/admin/collections/menus',
    )
    expect(create).not.toHaveBeenCalled()
  })

  test('should return to Admin when no tenants are available', async () => {
    getTenantOptions.mockResolvedValue([])
    expect(await getGlobalViewRedirect(args)).toBe('/admin')
  })

  test('should retain selected-tenant creation when its global is missing', async () => {
    find.mockResolvedValue({ docs: [] })
    expect(
      await getGlobalViewRedirect({
        ...args,
        headers: new Headers({ cookie: 'payload-tenant=b' }),
      }),
    ).toBe('/admin/collections/menus/create')
  })

  test('should fall back to an available tenant for an inaccessible document', async () => {
    find.mockResolvedValueOnce({ docs: [] })
    expect(
      await getGlobalViewRedirect({
        ...args,
        docID: 'forbidden',
        headers: new Headers({ cookie: 'payload-tenant=a' }),
        view: 'document',
      }),
    ).toBe('/admin/collections/menus/menu-a')
  })
})
