import type { Block, Config, Field, RelationshipField, SanitizedConfig } from 'payload'

import { defaults } from '../defaults.js'
import { filterDocumentsByTenants } from '../filters/filterDocumentsByTenants.js'

type AddFilterOptionsToFieldsArgs = {
  blockReferencesWithFilters: string[]
  config: Config | SanitizedConfig
  fields: Field[]
  tenantEnabledCollectionSlugs: string[]
  tenantEnabledGlobalSlugs: string[]
  tenantFieldName: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
}

export function addFilterOptionsToFields({
  blockReferencesWithFilters,
  config,
  fields,
  tenantEnabledCollectionSlugs,
  tenantEnabledGlobalSlugs,
  tenantFieldName,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
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
          addFilter({
            field,
            tenantEnabledCollectionSlugs,
            tenantFieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
          })
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
              tenantsArrayFieldName,
              tenantsArrayTenantFieldName,
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
        blockReferencesWithFilters,
        config,
        fields: field.fields,
        tenantEnabledCollectionSlugs,
        tenantEnabledGlobalSlugs,
        tenantFieldName,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        tenantsCollectionSlug,
      })
    }

    if (field.type === 'blocks') {
      ;(field.blockReferences ?? field.blocks).forEach((_block) => {
        let block: Block | undefined

        if (typeof _block === 'string') {
          if (blockReferencesWithFilters.includes(_block)) {
            return
          }
          block = config?.blocks?.find((b) => b.slug === _block)
          blockReferencesWithFilters.push(_block)
        } else {
          block = _block
        }

        if (block?.fields) {
          addFilterOptionsToFields({
            blockReferencesWithFilters,
            config,
            fields: block.fields,
            tenantEnabledCollectionSlugs,
            tenantEnabledGlobalSlugs,
            tenantFieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
          })
        }
      })
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        addFilterOptionsToFields({
          blockReferencesWithFilters,
          config,
          fields: tab.fields,
          tenantEnabledCollectionSlugs,
          tenantEnabledGlobalSlugs,
          tenantFieldName,
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
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
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
}
function addFilter({
  field,
  tenantEnabledCollectionSlugs,
  tenantFieldName,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
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
    const tenantFilterResults = filterDocumentsByTenants({
      filterFieldName: tenantFieldName,
      req: args.req,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      tenantsCollectionSlug,
    })

    // If the tenant filter returns null, meaning no tenant filter, just use the original filter
    if (tenantFilterResults === null) {
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
