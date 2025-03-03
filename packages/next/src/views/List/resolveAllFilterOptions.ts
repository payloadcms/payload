import type { Field, PayloadRequest, ResolvedFilterOptions } from 'payload'

import { resolveFilterOptions } from '@payloadcms/ui/rsc'
import { fieldHasSubFields, fieldIsHiddenOrDisabled } from 'payload/shared'

export const resolveAllFilterOptions = async ({
  fields,
  req,
  result,
}: {
  fields: Field[]
  req: PayloadRequest
  result?: Map<string, ResolvedFilterOptions>
}): Promise<Map<string, ResolvedFilterOptions>> => {
  const resolvedFilterOptions = !result ? new Map<string, ResolvedFilterOptions>() : result

  await Promise.all(
    fields.map(async (field) => {
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

      if (fieldHasSubFields(field)) {
        await resolveAllFilterOptions({
          fields: field.fields,
          req,
          result: resolvedFilterOptions,
        })
      }

      if (field.type === 'tabs') {
        await Promise.all(
          field.tabs.map((tab) =>
            resolveAllFilterOptions({
              fields: tab.fields,
              req,
              result: resolvedFilterOptions,
            }),
          ),
        )
      }
    }),
  )

  return resolvedFilterOptions
}
