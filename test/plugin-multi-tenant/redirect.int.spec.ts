import type { Payload, ServerAdapter, User } from 'payload'

import { expect } from 'vitest'

import { getGlobalViewRedirect } from '../../packages/plugin-multi-tenant/src/utilities/getGlobalViewRedirect.js'
import { getTenantOptions } from '../../packages/plugin-multi-tenant/src/utilities/getTenantOptions.js'
import { test } from '../__helpers/int/vitest.js'
import { credentials } from './credentials.js'
import { autosaveGlobalSlug, tenantsSlug, usersSlug } from './shared.js'

const getRedirect = ({
  docID,
  payload,
  tenantID,
  user,
  view = 'list',
}: {
  docID?: number | string
  payload: Payload
  tenantID: number | string
  user: User
  view?: 'document' | 'list'
}) =>
  getGlobalViewRedirect({
    slug: autosaveGlobalSlug,
    docID,
    headers: new Headers({ cookie: `payload-tenant=${tenantID}` }),
    payload,
    server: {
      unauthorized: () => {
        throw new Error('Unexpected unauthenticated redirect')
      },
    } as unknown as ServerAdapter,
    tenantFieldName: 'tenant',
    tenantsArrayFieldName: 'tenants',
    tenantsArrayTenantFieldName: 'tenant',
    tenantsCollectionSlug: tenantsSlug,
    useAsTitle: 'name',
    user,
    userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('admin')),
    view,
  })

test.suite('Multi-tenant global redirects', { config: './config.ts' }, () => {
  test('should read the assigned tenant options for a multi-tenant member', async ({ payload }) => {
    const { user } = await payload.login({ collection: usersSlug, data: credentials.owner })
    const options = await getTenantOptions({
      payload,
      tenantsArrayFieldName: 'tenants',
      tenantsArrayTenantFieldName: 'tenant',
      tenantsCollectionSlug: tenantsSlug,
      useAsTitle: 'name',
      user,
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('admin')),
    })

    expect(options.map(({ label }) => label)).toEqual(['Anchor Bar', 'Blue Dog'])
  })

  test('should reuse an existing draft global without publishing it', async ({ payload }) => {
    const { user } = await payload.login({ collection: usersSlug, data: credentials.admin })
    const tenants = await payload.find({ collection: tenantsSlug, overrideAccess: true, limit: 1 })
    const tenantID = tenants.docs[0].id
    const doc = await payload.create({
      collection: autosaveGlobalSlug,
      data: { tenant: tenantID, title: 'Existing draft global' },
      overrideAccess: true,
      version: 'draft',
    })

    await expect(getRedirect({ payload, tenantID, user })).resolves.toBe(
      `/admin/collections/${autosaveGlobalSlug}/${doc.id}`,
    )
    await expect(
      getRedirect({ docID: doc.id, payload, tenantID, user, view: 'document' }),
    ).resolves.toBeUndefined()

    const drafts = await payload.find({
      collection: autosaveGlobalSlug,
      overrideAccess: true,
      version: 'latest',
    })
    const published = await payload.find({
      collection: autosaveGlobalSlug,
      overrideAccess: true,
      version: 'published',
    })

    expect(drafts.docs.map(({ id }) => id)).toEqual([doc.id])
    expect(published.totalDocs).toBe(0)
  })

  test('should create only one draft when visiting an empty autosave global repeatedly', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: usersSlug, data: credentials.admin })
    const tenants = await payload.find({ collection: tenantsSlug, overrideAccess: true, limit: 1 })
    const tenantID = tenants.docs[0].id
    const firstRedirect = await getRedirect({ payload, tenantID, user })
    const secondRedirect = await getRedirect({ payload, tenantID, user })

    expect(firstRedirect).toMatch(new RegExp(`/admin/collections/${autosaveGlobalSlug}/[^/]+$`))
    expect(secondRedirect).toBe(firstRedirect)
    const drafts = await payload.find({
      collection: autosaveGlobalSlug,
      overrideAccess: true,
      version: 'latest',
    })

    expect(drafts.totalDocs).toBe(1)
    expect(drafts.docs[0]._status).toBe('draft')
  })

  test('should allow a tenant member to create their own autosave global', async ({ payload }) => {
    const { user } = await payload.login({ collection: usersSlug, data: credentials.blueDog })
    const tenants = await payload.find({
      collection: tenantsSlug,
      overrideAccess: true,
      where: { name: { equals: 'Blue Dog' } },
    })
    const tenantID = tenants.docs[0].id
    const redirect = await getRedirect({ payload, tenantID, user })
    const documents = await payload.find({
      collection: autosaveGlobalSlug,
      depth: 0,
      overrideAccess: false,
      user,
      version: 'latest',
    })

    expect(documents.totalDocs).toBe(1)
    expect(documents.docs[0].tenant).toBe(tenantID)
    expect(redirect).toBe(`/admin/collections/${autosaveGlobalSlug}/${documents.docs[0].id}`)
  })

  test('should not redirect a user to another tenant global selected through a cookie', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: usersSlug, data: credentials.blueDog })
    const tenants = await payload.find({
      collection: tenantsSlug,
      overrideAccess: true,
      where: { name: { equals: 'Steel Cat' } },
    })
    const tenantID = tenants.docs[0].id
    const doc = await payload.create({
      collection: autosaveGlobalSlug,
      data: { tenant: tenantID, title: 'Private tenant global' },
      overrideAccess: true,
      version: 'published',
    })

    const redirect = await getRedirect({ payload, tenantID, user })

    expect(redirect).not.toBe(`/admin/collections/${autosaveGlobalSlug}/${doc.id}`)
    const documents = await payload.find({
      collection: autosaveGlobalSlug,
      overrideAccess: true,
      version: 'latest',
    })

    expect(documents.docs.map(({ id }) => id)).toEqual([doc.id])
  })
})
