import type { Block, Field, SanitizedConfig, TypedUser } from 'payload'

import { combineWhereConstraints } from 'payload/shared'

/**
 * Recursively applies baseFilter from collection config to relationship fields
 * within blocks. This ensures that relationship drawers in blocks respect
 * collection-level filters like multi-tenant filtering.
 *
 * Based on the fix from PR #13229 for LinkFeature
 */
export function applyBaseFilterToFields(fields: Field[], config: SanitizedConfig): Field[] {
  return fields.map((field) => {
    // Handle relationship fields
    if (field.type === 'relationship') {
      const relationshipField = field

      // Store the original filterOptions
      const originalFilterOptions = relationshipField.filterOptions

      // Create new filterOptions that includes baseFilter
      relationshipField.filterOptions = async (args) => {
        const { relationTo, req, user } = args

        // Call original filterOptions if it exists
        const originalResult =
          typeof originalFilterOptions === 'function'
            ? await originalFilterOptions(args)
            : (originalFilterOptions ?? true)

        // If original filter returns false, respect that
        if (originalResult === false) {
          return false
        }

        // Get the collection's admin config
        const admin = config.collections.find(({ slug }) => slug === relationTo)?.admin

        // Check if collection is hidden
        const hidden = admin?.hidden
        if (typeof hidden === 'function' && hidden({ user } as { user: TypedUser })) {
          return false
        }

        // Apply baseFilter (with backwards compatibility for baseListFilter)
        const baseFilter = admin?.baseFilter ?? admin?.baseListFilter
        const baseFilterResult = await baseFilter?.({
          limit: 0,
          page: 1,
          req,
          sort: 'id',
        })

        // If no baseFilter, return original result
        if (!baseFilterResult) {
          return originalResult
        }

        // If original result is true, just return the baseFilter
        if (originalResult === true) {
          return baseFilterResult
        }

        // Combine original and baseFilter results
        return combineWhereConstraints([originalResult, baseFilterResult], 'and')
      }

      return relationshipField
    }

    // Recursively process nested fields
    if ('fields' in field && field.fields) {
      return {
        ...field,
        fields: applyBaseFilterToFields(field.fields, config),
      }
    }

    // Handle tabs
    if (field.type === 'tabs' && 'tabs' in field) {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: applyBaseFilterToFields(tab.fields, config),
        })),
      }
    }

    // Handle blocks
    if (field.type === 'blocks') {
      const blocks = (field.blockReferences ?? field.blocks ?? []) as Block[]
      return {
        ...field,
        blocks: blocks.map((block) => {
          if (typeof block === 'string') {
            return block
          }
          return {
            ...block,
            fields: applyBaseFilterToFields(block.fields, config),
          }
        }),
      }
    }

    return field
  })
}
