import type { Payload, TypedUser, ViewTypes } from '@ruya.sa/payload'

import { unauthorized } from 'next/navigation.js'
import { formatAdminURL, hasAutosaveEnabled } from '@ruya.sa/payload/shared'

import type { MultiTenantPluginConfig } from '../types.js'

import { getCollectionIDType } from './getCollectionIDType.js'
import { getTenantFromCookie } from './getTenantFromCookie.js'
import { getTenantOptions } from './getTenantOptions.js'

type Args = {
  /**
   * This is no longer needed and is handled internally.
   *
   * @deprecated
   */
  basePath?: string
  docID?: number | string
  headers: Headers
  payload: Payload
  slug: string
  tenantFieldName: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  useAsTitle: string
  user?: TypedUser
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig<any>>['userHasAccessToAllTenants']
  view: ViewTypes
}
export async function getGlobalViewRedirect({
  slug: collectionSlug,
  docID,
  headers,
  payload,
  tenantFieldName,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  useAsTitle,
  user,
  userHasAccessToAllTenants,
  view,
}: Args): Promise<string | void> {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload,
  })
  let tenant = getTenantFromCookie(headers, idType)
  let redirectRoute: `/${string}` | void = undefined

  if (!user) {
    return unauthorized()
  }

  if (!tenant) {
    const tenantOptions = await getTenantOptions({
      payload,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      tenantsCollectionSlug,
      useAsTitle,
      user,
      userHasAccessToAllTenants,
    })

    tenant = tenantOptions[0]?.value || null
  }

  if (tenant) {
    try {
      const globalTenantDocQuery = await payload.find({
        collection: collectionSlug,
        depth: 0,
        limit: 1,
        pagination: false,
        select: {
          id: true,
        },
        where: {
          [tenantFieldName]: {
            in: [tenant],
          },
        },
      })

      const globalTenantDocID = globalTenantDocQuery?.docs?.[0]?.id

      if (view === 'document') {
        // global tenant document edit view
        if (globalTenantDocID && docID !== globalTenantDocID) {
          // tenant document already exists but does not match current route docID
          // redirect to matching tenant docID from query
          redirectRoute = `/collections/${collectionSlug}/${globalTenantDocID}`
        } else if (docID && !globalTenantDocID) {
          // a docID was found in the route but no global document with this tenant exists
          // so we need to generate a redirect to the create route
          redirectRoute = await generateCreateRedirect({
            collectionSlug,
            payload,
            tenantID: tenant,
          })
        }
      } else if (view === 'list') {
        // global tenant document list view
        if (globalTenantDocID) {
          // tenant document exists, redirect from list view to the document edit view
          redirectRoute = `/collections/${collectionSlug}/${globalTenantDocID}`
        } else {
          // no matching document was found for the current tenant
          // so we need to generate a redirect to the create route
          redirectRoute = await generateCreateRedirect({
            collectionSlug,
            payload,
            tenantID: tenant,
          })
        }
      }
    } catch (e: unknown) {
      const prefix = `${e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' ? `${e.message} - ` : ''}`
      payload.logger.error(e, `${prefix}Multi Tenant Redirect Error`)
    }
  } else {
    // no tenants were found, redirect to the admin view
    return formatAdminURL({
      adminRoute: payload.config.routes.admin,
      path: '',
      serverURL: payload.config.serverURL,
    })
  }

  if (redirectRoute) {
    return formatAdminURL({
      adminRoute: payload.config.routes.admin,
      path: redirectRoute,
      serverURL: payload.config.serverURL,
    })
  }

  // no redirect is needed
  // the current route is valid
  return undefined
}

type GenerateCreateArgs = {
  collectionSlug: string
  payload: Payload
  tenantID: number | string
}
/**
 * Generate a redirect URL for creating a new document in a multi-tenant collection.
 *
 * If autosave is enabled on the collection, we need to create the document and then redirect to it.
 * Otherwise we can redirect to the default create route.
 */
async function generateCreateRedirect({
  collectionSlug,
  payload,
  tenantID,
}: GenerateCreateArgs): Promise<`/${string}` | undefined> {
  const collectionConfig = payload.collections[collectionSlug]?.config
  if (hasAutosaveEnabled(collectionConfig!)) {
    // Autosave is enabled, create a document first
    try {
      const doc = await payload.create({
        collection: collectionSlug,
        data: {
          tenant: tenantID,
        },
        depth: 0,
        draft: true,
        select: {
          id: true,
        },
      })
      return `/collections/${collectionSlug}/${doc.id}`
    } catch (error) {
      payload.logger.error(
        error,
        `Error creating autosave global multi tenant document for ${collectionSlug}`,
      )
    }

    return '/'
  }

  // Autosave is not enabled, redirect to default create route
  return `/collections/${collectionSlug}/create`
}
