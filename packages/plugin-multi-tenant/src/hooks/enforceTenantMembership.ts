import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { ValidationError } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { isValidTenantAssignment } from '../utilities/isValidTenantAssignment.js'

type Args<ConfigType = unknown> = {
  collection: CollectionConfig
  tenantFieldName: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}

/**
 * Reject writes that assign a tenant the user is not a member of.
 *
 * The tenant field's own `validate` covers this on ordinary writes and gives the
 * admin panel an inline field error, but Payload skips field validation for draft,
 * autosave, trash and restore-version writes. A collection `beforeValidate` hook
 * always runs, so this is the check that actually closes those paths.
 */
export const addCollectionBeforeValidateHook = <ConfigType = unknown>({
  collection,
  tenantFieldName,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
}: Args<ConfigType>) => {
  collection.hooks ??= {}
  collection.hooks.beforeValidate ??= []
  collection.hooks.beforeValidate.push(
    enforceTenantMembership<ConfigType>({
      collectionSlug: collection.slug,
      tenantFieldName,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      userHasAccessToAllTenants,
    }),
  )
}

const enforceTenantMembership =
  <ConfigType = unknown>({
    collectionSlug,
    tenantFieldName,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    userHasAccessToAllTenants,
  }: { collectionSlug: string } & Omit<
    Args<ConfigType>,
    'collection'
  >): CollectionBeforeValidateHook =>
  ({ data, originalDoc, req }) => {
    if (!data || !(tenantFieldName in data)) {
      return data
    }

    if (
      !isValidTenantAssignment<ConfigType>({
        previousValue: originalDoc?.[tenantFieldName],
        req,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        userHasAccessToAllTenants,
        value: (data as Record<string, unknown>)[tenantFieldName],
      })
    ) {
      throw new ValidationError(
        {
          collection: collectionSlug,
          errors: [{ message: req.t('validation:invalidSelection'), path: tenantFieldName }],
        },
        req.t,
      )
    }

    return data
  }
