import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Page, Post, Tenant } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { usersSlug } from '../plugin-multi-tenant/shared.js'
import { pagesSlug } from './collections/pages.js'
import { postsSlug } from './collections/posts.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Builds a minimal `PayloadRequest`-like object carrying a `payload-tenant`
 * cookie, matching how the admin UI scopes relationship/link pickers to the
 * currently selected tenant.
 */
const reqWithTenantCookie = (tenantID: number | string): any => ({
  headers: new Headers([['cookie', `payload-tenant=${tenantID}`]]),
  payload,
})

/**
 * Recursively walks a `Where` clause looking for an `{ in: [...] }` constraint
 * that references the given tenant ID. Used instead of a plain deep-equal check
 * so the assertions don't depend on exactly how the filter is nested (e.g.
 * whether it's wrapped in an `and`), only on which tenant it actually scopes to.
 */
const whereReferencesTenant = (where: unknown, tenantID: number | string): boolean => {
  if (!where || typeof where !== 'object') {
    return false
  }

  if (Array.isArray(where)) {
    return where.some((entry) => whereReferencesTenant(entry, tenantID))
  }

  const clause = where as Record<string, unknown>

  if (Array.isArray(clause.in)) {
    return clause.in.some((value) => String(value) === String(tenantID))
  }

  return Object.values(clause).some((value) => whereReferencesTenant(value, tenantID))
}

/**
 * Pulls the sanitized `filterOptions` function off the internal `doc`
 * relationship field that LinkFeature adds to a richText field's Lexical
 * `link` node. Mirrors the pattern used in `test/lexical/lexical.int.spec.ts`
 * for reaching into `editorConfig.resolvedFeatureMap`.
 */
const getLinkDocFilterOptions = (richTextFieldName: string): any => {
  const richTextField = payload.collections[postsSlug].config.fields.find(
    (field) => 'name' in field && field.name === richTextFieldName,
  ) as any

  const linkFeature = richTextField.editor.editorConfig.resolvedFeatureMap.get('link')
  // Only the LinkNode (not AutoLinkNode) exposes `getSubFields`.
  const linkNodeWithFields = linkFeature.nodes.find(
    (node: any) => typeof node.getSubFields === 'function',
  )
  const subFields = linkNodeWithFields.getSubFields({})
  const docField = subFields.find((field: any) => 'name' in field && field.name === 'doc')

  return docField.filterOptions
}

describe('lexical-link-picker-tenant', () => {
  let tenantA: Tenant
  let tenantB: Tenant
  let pageA: Page
  let pageB: Page
  let post: Post

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    await restClient.login({ slug: usersSlug })

    tenantA = await payload.create({
      collection: 'tenants',
      data: { name: 'Tenant A', domain: 'tenant-a.lexical-link-picker-tenant.test' },
    })
    tenantB = await payload.create({
      collection: 'tenants',
      data: { name: 'Tenant B', domain: 'tenant-b.lexical-link-picker-tenant.test' },
    })

    pageA = await payload.create({
      collection: pagesSlug,
      data: { title: 'Tenant A Home', tenant: tenantA.id },
    })
    pageB = await payload.create({
      collection: pagesSlug,
      data: { title: 'Tenant B Home', tenant: tenantB.id },
    })

    post = await payload.create({
      collection: postsSlug,
      data: { title: 'A post', tenant: tenantA.id },
    })
  })

  afterAll(async () => {
    await payload.delete({ collection: postsSlug, id: post.id })
    await payload.delete({ collection: pagesSlug, id: pageA.id })
    await payload.delete({ collection: pagesSlug, id: pageB.id })
    await payload.delete({ collection: 'tenants', id: tenantA.id })
    await payload.delete({ collection: 'tenants', id: tenantB.id })
    await payload.destroy()
  })

  it('scopes the plain relationship field (control) to the selected tenant', async () => {
    const relatedPageField = payload.collections[postsSlug].config.fields.find(
      (field) => 'name' in field && field.name === 'relatedPage',
    ) as any

    const filter = await relatedPageField.filterOptions({
      relationTo: pagesSlug,
      req: reqWithTenantCookie(tenantA.id),
    })

    expect(filter).not.toBeNull()
    expect(filter).not.toBe(true)
    expect(whereReferencesTenant(filter, tenantA.id)).toBe(true)
    expect(whereReferencesTenant(filter, tenantB.id)).toBe(false)
  })

  it('scopes the default LinkFeature internal-link picker to the selected tenant', async () => {
    const filterOptions = getLinkDocFilterOptions('contentDefaultLink')

    const filter = await filterOptions({
      relationTo: pagesSlug,
      req: reqWithTenantCookie(tenantA.id),
    })

    expect(filter).not.toBeNull()
    expect(filter).not.toBe(true)
    expect(whereReferencesTenant(filter, tenantA.id)).toBe(true)
    expect(whereReferencesTenant(filter, tenantB.id)).toBe(false)
  })

  it(
    'scopes the LinkFeature({ enabledCollections }) internal-link picker to the selected ' +
      'tenant (regression for #17765)',
    async () => {
      const defaultFilterOptions = getLinkDocFilterOptions('contentDefaultLink')
      const enabledCollectionsFilterOptions = getLinkDocFilterOptions(
        'contentEnabledCollectionsLink',
      )

      const req = reqWithTenantCookie(tenantA.id)

      const defaultFilter = await defaultFilterOptions({ relationTo: pagesSlug, req })
      const enabledCollectionsFilter = await enabledCollectionsFilterOptions({
        relationTo: pagesSlug,
        req,
      })

      // The bug: LinkFeature({ enabledCollections }) dropped `filterOptions` entirely
      // (returning `null`, i.e. no restriction), unlike the default LinkFeature above.
      expect(enabledCollectionsFilter).not.toBeNull()
      expect(enabledCollectionsFilter).not.toBe(true)
      expect(whereReferencesTenant(enabledCollectionsFilter, tenantA.id)).toBe(true)
      expect(whereReferencesTenant(enabledCollectionsFilter, tenantB.id)).toBe(false)

      // Both pickers read the same collection-level tenant `baseFilter`, so they
      // should resolve to the same filter for the same tenant context.
      expect(enabledCollectionsFilter).toEqual(defaultFilter)
    },
  )
})
