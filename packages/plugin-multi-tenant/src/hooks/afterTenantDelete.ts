import type {
  CollectionAfterDeleteHook,
  CollectionConfig,
  JsonObject,
  PaginatedDocs,
} from 'payload'

import { generateCookie, mergeHeaders } from 'payload'

import type { UserWithTenantsField } from '../types.js'

import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Args = {
  collection: CollectionConfig
  enabledSlugs: string[]
  tenantFieldName: string
  usersSlug: string
}
/**
 * Add cleanup logic when tenant is deleted
 * - delete documents related to tenant
 * - remove tenant from users
 */
export const addTenantCleanup = ({
  collection,
  enabledSlugs,
  tenantFieldName,
  usersSlug,
}: Args) => {
  if (!collection.hooks) {
    collection.hooks = {}
  }
  if (!collection.hooks?.afterDelete) {
    collection.hooks.afterDelete = []
  }
  collection.hooks.afterDelete.push(
    afterTenantDelete({
      enabledSlugs,
      tenantFieldName,
      usersSlug,
    }),
  )
}

export const afterTenantDelete =
  ({
    enabledSlugs,
    tenantFieldName,
    usersSlug,
  }: Omit<Args, 'collection'>): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    const currentTenantCookieID = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)
    if (currentTenantCookieID === id) {
      const newHeaders = new Headers({
        'Set-Cookie': generateCookie<string>({
          name: 'payload-tenant',
          expires: new Date(Date.now() - 1000),
          path: '/',
          returnCookieAsObject: false,
          value: '',
        }),
      })

      req.responseHeaders = req.responseHeaders
        ? mergeHeaders(req.responseHeaders, newHeaders)
        : newHeaders
    }
    const cleanupPromises: Promise<JsonObject>[] = []
    enabledSlugs.forEach((slug) => {
      cleanupPromises.push(
        req.payload.delete({
          collection: slug,
          where: {
            [tenantFieldName]: {
              equals: id,
            },
          },
        }),
      )
    })

    try {
      const usersWithTenant = (await req.payload.find({
        collection: usersSlug,
        depth: 0,
        limit: 0,
        where: {
          'tenants.tenant': {
            equals: id,
          },
        },
      })) as PaginatedDocs<UserWithTenantsField>

      usersWithTenant?.docs?.forEach((user) => {
        cleanupPromises.push(
          req.payload.update({
            id: user.id,
            collection: usersSlug,
            data: {
              tenants: (user.tenants || []).filter(({ tenant: tenantID }) => tenantID !== id),
            },
          }),
        )
      })
    } catch (e) {
      console.error('Error deleting tenants from users:', e)
    }

    await Promise.all(cleanupPromises)
  }
