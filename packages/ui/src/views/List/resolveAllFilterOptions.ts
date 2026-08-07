import type { Field, Option, PayloadRequest, ResolvedFilterOptions } from 'payload'

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsHiddenOrDisabled,
  tabHasName,
} from 'payload/shared'

import { resolveFilterOptions } from '../../utilities/resolveFilterOptions.js'

export const resolveAllFilterOptions = async ({
  fields,
  pathPrefix,
  req,
  result,
}: {
  fields: Field[]
  pathPrefix?: string
  req: PayloadRequest
  result?: Map<string, Option[] | ResolvedFilterOptions>
}): Promise<Map<string, Option[] | ResolvedFilterOptions>> => {
  const resolvedFilterOptions = !result
    ? new Map<string, Option[] | ResolvedFilterOptions>()
    : result

  await Promise.all(
    fields.map(async (field) => {
      if (fieldIsHiddenOrDisabled(field)) {
        return
      }

      const fieldPath = fieldAffectsData(field)
        ? pathPrefix
          ? `${pathPrefix}.${field.name}`
          : field.name
        : pathPrefix

      if (
        (field.type === 'relationship' || field.type === 'upload') &&
        'filterOptions' in field &&
        field.filterOptions
      ) {
        const options = await resolveFilterOptions(field.filterOptions, {
          id: undefined,
          blockData: undefined,
          data: {}, // use empty object to prevent breaking queries when accessing properties of `data`
          relationTo: field.relationTo,
          req,
          siblingData: {}, // use empty object to prevent breaking queries when accessing properties of `siblingData`
          user: req.user,
        })

        resolvedFilterOptions.set(fieldPath, options)
      }

      if (field.type === 'select' && typeof field.filterOptions === 'function') {
        const options = await field.filterOptions({
          data: {}, // use empty object to prevent breaking queries when accessing properties of `data`
          options: field.options,
          req,
          siblingData: {}, // use empty object to prevent breaking queries when accessing properties of `siblingData`
        })

        resolvedFilterOptions.set(fieldPath, options)
      }

      if (fieldHasSubFields(field)) {
        await resolveAllFilterOptions({
          fields: field.fields,
          pathPrefix: fieldPath,
          req,
          result: resolvedFilterOptions,
        })
      }

      if (field.type === 'tabs') {
        await Promise.all(
          field.tabs.map(async (tab) => {
            const tabPath = tabHasName(tab)
              ? fieldPath
                ? `${fieldPath}.${tab.name}`
                : tab.name
              : fieldPath

            await resolveAllFilterOptions({
              fields: tab.fields,
              pathPrefix: tabPath,
              req,
              result: resolvedFilterOptions,
            })
          }),
        )
      }
    }),
  )

  return resolvedFilterOptions
}
