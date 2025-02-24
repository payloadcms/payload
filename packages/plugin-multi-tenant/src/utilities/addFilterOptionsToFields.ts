import type { Config, Field, FilterOptionsProps, RelationshipField, SanitizedConfig } from 'payload'

import { getCollectionIDType } from './getCollectionIDType.js'
import { getTenantFromCookie } from './getTenantFromCookie.js'

type AddFilterOptionsToFieldsArgs = {
  config: Config | SanitizedConfig
  fields: Field[]
  tenantEnabledCollectionSlugs: string[]
  tenantEnabledGlobalSlugs: string[]
  tenantFieldName: string
  tenantsCollectionSlug: string
}

export function addFilterOptionsToFields({
  config,
  fields,
  tenantEnabledCollectionSlugs,
  tenantEnabledGlobalSlugs,
  tenantFieldName,
  tenantsCollectionSlug,
}: AddFilterOptionsToFieldsArgs) {
  fields.forEach((field) => {
    if (field.type === 'relationship') {
      /**
       * Adjusts relationship fields to filter by tenant
       * and ensures relationTo cannot be a tenant global collection
       */
      if (typeof field.relationTo === 'string') {
        if (tenantEnabledGlobalSlugs.includes(field.relationTo)) {
          throw new Error(
            `The collection ${field.relationTo} is a global collection and cannot be related to a tenant enabled collection.`,
          )
        }
        if (tenantEnabledCollectionSlugs.includes(field.relationTo)) {
          addFilter({ field, tenantEnabledCollectionSlugs, tenantFieldName, tenantsCollectionSlug })
        }
      } else {
        field.relationTo.map((relationTo) => {
          if (tenantEnabledGlobalSlugs.includes(relationTo)) {
            throw new Error(
              `The collection ${relationTo} is a global collection and cannot be related to a tenant enabled collection.`,
            )
          }
          if (tenantEnabledCollectionSlugs.includes(relationTo)) {
            addFilter({
              field,
              tenantEnabledCollectionSlugs,
              tenantFieldName,
              tenantsCollectionSlug,
            })
          }
        })
      }
    }

    if (
      field.type === 'row' ||
      field.type === 'array' ||
      field.type === 'collapsible' ||
      field.type === 'group'
    ) {
      addFilterOptionsToFields({
        config,
        fields: field.fields,
        tenantEnabledCollectionSlugs,
        tenantEnabledGlobalSlugs,
        tenantFieldName,
        tenantsCollectionSlug,
      })
    }

    if (field.type === 'blocks') {
      ;(field.blockReferences ?? field.blocks).forEach((_block) => {
        const block =
          typeof _block === 'string'
            ? // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
              config?.blocks?.find((b) => b.slug === _block)
            : _block

        if (block?.fields) {
          addFilterOptionsToFields({
            config,
            fields: block.fields,
            tenantEnabledCollectionSlugs,
            tenantEnabledGlobalSlugs,
            tenantFieldName,
            tenantsCollectionSlug,
          })
        }
      })
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        addFilterOptionsToFields({
          config,
          fields: tab.fields,
          tenantEnabledCollectionSlugs,
          tenantEnabledGlobalSlugs,
          tenantFieldName,
          tenantsCollectionSlug,
        })
      })
    }
  })
}

type AddFilterArgs = {
  field: RelationshipField
  tenantEnabledCollectionSlugs: string[]
  tenantFieldName: string
  tenantsCollectionSlug: string
}
function addFilter({
  field,
  tenantEnabledCollectionSlugs,
  tenantFieldName,
  tenantsCollectionSlug,
}: AddFilterArgs) {
  // User specified filter
  const originalFilter = field.filterOptions
  field.filterOptions = async (args) => {
    const originalFilterResult =
      typeof originalFilter === 'function' ? await originalFilter(args) : (originalFilter ?? true)

    // If the relationTo is not a tenant enabled collection, return early
    if (args.relationTo && !tenantEnabledCollectionSlugs.includes(args.relationTo)) {
      return originalFilterResult
    }

    // If the original filtr returns false, return early
    if (originalFilterResult === false) {
      return false
    }

    // Custom tenant filter
    const tenantFilterResults = filterOptionsByTenant({
      ...args,
      tenantFieldName,
      tenantsCollectionSlug,
    })

    // If the tenant filter returns true, just use the original filter
    if (tenantFilterResults === true) {
      return originalFilterResult
    }

    // If the original filter returns true, just use the tenant filter
    if (originalFilterResult === true) {
      return tenantFilterResults
    }

    return {
      and: [originalFilterResult, tenantFilterResults],
    }
  }
}

type Args = {
  tenantFieldName?: string
  tenantsCollectionSlug: string
} & FilterOptionsProps
const filterOptionsByTenant = ({
  req,
  tenantFieldName = 'tenant',
  tenantsCollectionSlug,
}: Args) => {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload: req.payload,
  })
  const selectedTenant = getTenantFromCookie(req.headers, idType)
  if (!selectedTenant) {
    return true
  }

  return {
    or: [
      // ie a related collection that doesn't have a tenant field
      {
        [tenantFieldName]: {
          exists: false,
        },
      },
      // related collections that have a tenant field
      {
        [tenantFieldName]: {
          equals: selectedTenant,
        },
      },
    ],
  }
}
