import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { ValidationError } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { isValidTenantAssignment } from '../utilities/isValidTenantAssignment.js'

type Args = {
  collection: CollectionConfig
  tenantFieldName: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig>['userHasAccessToAllTenants']
}

export const addCollectionBeforeValidateHook = ({
  collection,
  tenantFieldName,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
}: Args) => {
  collection.hooks ??= {}
  collection.hooks.beforeValidate ??= []
  collection.hooks.beforeValidate.push(
    enforceTenantMembership({
      collectionSlug: collection.slug,
      tenantFieldName,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      userHasAccessToAllTenants,
    }),
  )
}

export const enforceTenantMembership =
  ({
    collectionSlug,
    tenantFieldName,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    userHasAccessToAllTenants,
  }: { collectionSlug: string } & Omit<Args, 'collection'>): CollectionBeforeValidateHook =>
  ({ data, originalDoc, req }) => {
    if (!data || !(tenantFieldName in data)) {
      return data
    }

    if (
      !isValidTenantAssignment({
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
