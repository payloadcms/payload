import type {
  CollectionAfterDeleteHook,
  CollectionConfig,
  JsonObject,
  PaginatedDocs,
} from 'payload'

import { generateCookie, mergeHeaders } from 'payload'

import type { UserWithTenantsField } from '../types.js'

import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Args = {
  collection: CollectionConfig
  enabledSlugs: string[]
  tenantFieldName: string
  tenantsCollectionSlug: string
  usersSlug: string
  usersTenantsArrayFieldName: string
  usersTenantsArrayTenantFieldName: string
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
  tenantsCollectionSlug,
  usersSlug,
  usersTenantsArrayFieldName,
  usersTenantsArrayTenantFieldName,
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
      tenantsCollectionSlug,
      usersSlug,
      usersTenantsArrayFieldName,
      usersTenantsArrayTenantFieldName,
    }),
  )
}

export const afterTenantDelete =
  ({
    enabledSlugs,
    tenantFieldName,
    tenantsCollectionSlug,
    usersSlug,
    usersTenantsArrayFieldName,
    usersTenantsArrayTenantFieldName,
  }: Omit<Args, 'collection'>): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    const idType = getCollectionIDType({
      collectionSlug: tenantsCollectionSlug,
      payload: req.payload,
    })
    const currentTenantCookieID = getTenantFromCookie(req.headers, idType)
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
          [`${usersTenantsArrayFieldName}.${usersTenantsArrayTenantFieldName}`]: {
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
              [usersTenantsArrayFieldName]: (user[usersTenantsArrayFieldName] || []).filter(
                (row: Record<string, string>) => {
                  if (row[usersTenantsArrayTenantFieldName]) {
                    return row[usersTenantsArrayTenantFieldName] !== id
                  }
                },
              ),
            },
          }),
        )
      })
    } catch (e) {
      console.error('Error deleting tenants from users:', e)
    }

    await Promise.all(cleanupPromises)
  }
