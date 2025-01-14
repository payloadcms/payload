import type { Field, FilterOptionsProps, RelationshipField } from 'payload'

import { getTenantFromCookie } from './getTenantFromCookie.js'

export function addFilterOptionsToFields(fields: Field[], tenantEnabledCollectionSlugs: string[]) {
  fields.forEach((field) => {
    if (field.type === 'relationship') {
      if (typeof field.relationTo === 'string') {
        if (tenantEnabledCollectionSlugs.includes(field.relationTo)) {
          addFilter(field, tenantEnabledCollectionSlugs)
        }
      } else {
        field.relationTo.map((relation) => {
          if (tenantEnabledCollectionSlugs.includes(relation)) {
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
      addFilterOptionsToFields(field.fields, tenantEnabledCollectionSlugs)
    }

    if (field.type === 'blocks') {
      field.blocks.forEach((block) => {
        addFilterOptionsToFields(block.fields, tenantEnabledCollectionSlugs)
      })
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        addFilterOptionsToFields(tab.fields, tenantEnabledCollectionSlugs)
      })
    }
  })
}

function addFilter(field: RelationshipField, tenantEnabledCollectionSlugs: string[]) {
  // User specified filter
  const originalFilter = field.filterOptions
  field.filterOptions = async (args) => {
    const originalFilterResult =
      typeof originalFilter === 'function' ? await originalFilter(args) : originalFilter

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
