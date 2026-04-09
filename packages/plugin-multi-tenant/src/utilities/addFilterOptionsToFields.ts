import type { Block, Config, Field, RelationshipField, SanitizedConfig } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { defaults } from '../defaults.js'
import { filterDocumentsByTenants } from '../filters/filterDocumentsByTenants.js'

type AddFilterOptionsToFieldsArgs<ConfigType = unknown> = {
  blockReferencesWithFilters: string[]
  config: Config | SanitizedConfig
  fields: Field[]
  tenantEnabledCollectionSlugs: string[]
  tenantEnabledGlobalSlugs: string[]
  tenantFieldName: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}

export function addFilterOptionsToFields<ConfigType = unknown>({
  blockReferencesWithFilters,
  config,
  fields,
  tenantEnabledCollectionSlugs,
  tenantEnabledGlobalSlugs,
  tenantFieldName,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  userHasAccessToAllTenants,
}: AddFilterOptionsToFieldsArgs<ConfigType>): Field[] {
  const newFields = []
  for (const field of fields) {
    let newField: Field = { ...field }
    if (newField.type === 'relationship') {
      let hasTenantRelationsips = false
      /**
       * Adjusts relationship fields to filter by tenant
       * and ensures relationTo cannot be a tenant global collection
       */
      if (typeof newField.relationTo === 'string') {
        if (tenantEnabledGlobalSlugs.includes(newField.relationTo)) {
          throw new Error(
            `The collection ${newField.relationTo} is a global collection and cannot be related to a tenant enabled collection.`,
          )
        }
        if (tenantEnabledCollectionSlugs.includes(newField.relationTo)) {
          hasTenantRelationsips = true
        }
      } else {
        for (const relationTo of newField.relationTo) {
          if (tenantEnabledGlobalSlugs.includes(relationTo)) {
            throw new Error(
              `The collection ${relationTo} is a global collection and cannot be related to a tenant enabled collection.`,
            )
          }
          if (tenantEnabledCollectionSlugs.includes(relationTo)) {
            hasTenantRelationsips = true
          }
        }
      }

      if (hasTenantRelationsips) {
        newField = addRelationshipFilter({
          field: newField as RelationshipField,
          tenantEnabledCollectionSlugs,
          tenantFieldName,
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
          tenantsCollectionSlug,
          userHasAccessToAllTenants,
        })
      }
    }

    if (
      newField.type === 'row' ||
      newField.type === 'array' ||
      newField.type === 'collapsible' ||
      newField.type === 'group'
    ) {
      newField.fields = addFilterOptionsToFields({
        blockReferencesWithFilters,
        config,
        fields: newField.fields,
        tenantEnabledCollectionSlugs,
        tenantEnabledGlobalSlugs,
        tenantFieldName,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        tenantsCollectionSlug,
        userHasAccessToAllTenants,
      })
    }

    if (newField.type === 'blocks') {
      const newBlocks: Block[] = []
      ;(newField.blockReferences ?? newField.blocks).forEach((_block) => {
        let block: Block | undefined
        let isReference = false

        if (typeof _block === 'string') {
          if (blockReferencesWithFilters.includes(_block)) {
            return
          }
          isReference = true
          block = config?.blocks?.find((b) => b.slug === _block)
          blockReferencesWithFilters.push(_block)
        } else {
          // Create a shallow copy to avoid mutating the original block reference
          block = { ..._block }
        }

        if (block?.fields) {
          block.fields = addFilterOptionsToFields({
            blockReferencesWithFilters,
            config,
            fields: block.fields,
            tenantEnabledCollectionSlugs,
            tenantEnabledGlobalSlugs,
            tenantFieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
            userHasAccessToAllTenants,
          })
        }

        if (block && !isReference) {
          newBlocks.push(block)
        }
      })
      newField.blocks = newBlocks
    }

    if (newField.type === 'tabs') {
      newField.tabs = newField.tabs.map((tab) => {
        const newTab = { ...tab }
        newTab.fields = addFilterOptionsToFields({
          blockReferencesWithFilters,
          config,
          fields: tab.fields,
          tenantEnabledCollectionSlugs,
          tenantEnabledGlobalSlugs,
          tenantFieldName,
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
          tenantsCollectionSlug,
          userHasAccessToAllTenants,
        })
        return newTab
      })
    }

    newFields.push(newField)
  }

  return newFields
}

type AddFilterArgs<ConfigType = unknown> = {
  field: RelationshipField
  tenantEnabledCollectionSlugs: string[]
  tenantFieldName: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}
function addRelationshipFilter<ConfigType = unknown>({
  field,
  tenantEnabledCollectionSlugs,
  tenantFieldName,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  userHasAccessToAllTenants,
}: AddFilterArgs<ConfigType>): Field {
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
      docTenantID: args.data?.[tenantFieldName],
      filterFieldName: tenantFieldName,
      req: args.req,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      tenantsCollectionSlug,
      userHasAccessToAllTenants,
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

  return field
}
