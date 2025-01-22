import type { Field, FilterOptionsProps, RelationshipField } from 'payload'

import { getTenantFromCookie } from './getTenantFromCookie.js'

type AddFilterOptionsToFieldsArgs = {
  fields: Field[]
  tenantEnabledCollectionSlugs: string[]
  tenantEnabledGlobalSlugs: string[]
}

export function addFilterOptionsToFields({
  fields,
  tenantEnabledCollectionSlugs,
  tenantEnabledGlobalSlugs,
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
          addFilter(field, tenantEnabledCollectionSlugs)
        }
      } else {
        field.relationTo.map((relationTo) => {
          if (tenantEnabledGlobalSlugs.includes(relationTo)) {
            throw new Error(
              `The collection ${relationTo} is a global collection and cannot be related to a tenant enabled collection.`,
            )
          }
          if (tenantEnabledCollectionSlugs.includes(relationTo)) {
            addFilter(field, tenantEnabledCollectionSlugs)
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
        fields: field.fields,
        tenantEnabledCollectionSlugs,
        tenantEnabledGlobalSlugs,
      })
    }

    if (field.type === 'blocks') {
      field.blocks.forEach((block) => {
        addFilterOptionsToFields({
          fields: block.fields,
          tenantEnabledCollectionSlugs,
          tenantEnabledGlobalSlugs,
        })
      })
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        addFilterOptionsToFields({
          fields: tab.fields,
          tenantEnabledCollectionSlugs,
          tenantEnabledGlobalSlugs,
        })
      })
    }
  })
}

function addFilter(field: RelationshipField, tenantEnabledCollectionSlugs: string[]) {
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
    const tenantFilterResults = filterOptionsByTenant(args)

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
} & FilterOptionsProps
const filterOptionsByTenant = ({ req, tenantFieldName = 'tenant' }: Args) => {
  const selectedTenant = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)
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
