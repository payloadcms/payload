import type { CollectionConfig, PayloadRequest, ResolvedFilterOptions } from 'payload'

import { resolveFilterOptions } from '@payloadcms/ui/rsc'
import { fieldIsHiddenOrDisabled } from 'payload/shared'

export const resolveAllFilterOptions = async ({
  collectionConfig,
  req,
}: {
  collectionConfig: CollectionConfig
  req: PayloadRequest
}): Promise<Map<string, ResolvedFilterOptions>> => {
  const resolvedFilterOptions = new Map<string, ResolvedFilterOptions>()

  await Promise.all(
    collectionConfig.fields.map(async (field) => {
      if (fieldIsHiddenOrDisabled(field)) {
        return
      }

      if ('name' in field && 'filterOptions' in field && field.filterOptions) {
        const options = await resolveFilterOptions(field.filterOptions, {
          id: undefined,
          blockData: undefined,
          data: {}, // use empty object to prevent breaking queries when accessing properties of data
          relationTo: field.relationTo,
          req,
          siblingData: {}, // use empty object to prevent breaking queries when accessing properties of data
          user: req.user,
        })
        resolvedFilterOptions.set(field.name, options)
      }
    }),
  )

  return resolvedFilterOptions
}
