import type { BranchScopeField } from './compileBranchScopeFields.js'
import type { BranchContentScope } from './types.js'

import { hasLocalizedBranchFields } from './hasLocalizedBranchFields.js'

type ScopeData = Record<string, unknown>

/**
 * Extracts one scope from raw locale-keyed version data without fallback or read hooks.
 * Locale fragments retain row identities so composition never relies on array positions.
 */
export const projectBranchScopeData = ({
  data,
  fields,
  scope,
}: {
  data: ScopeData
  fields: readonly BranchScopeField[]
  scope: BranchContentScope
}): ScopeData => {
  const output: ScopeData = {}

  for (const field of fields) {
    if (!Object.hasOwn(data, field.name)) {
      continue
    }

    const value = data[field.name]

    if (field.type === 'value') {
      if (field.isLocalized) {
        const localizedValue = getRecord({ value })

        if (
          scope.type === 'locale' &&
          localizedValue &&
          Object.hasOwn(localizedValue, scope.locale)
        ) {
          setValue({
            data: output,
            key: field.name,
            value: { [scope.locale]: clone({ value: localizedValue[scope.locale] }) },
          })
        }
      } else if (scope.type === 'shared') {
        setValue({ data: output, key: field.name, value: clone({ value }) })
      }

      continue
    }

    if (field.type === 'group') {
      const groupValue = getRecord({ value })

      if (groupValue) {
        const nested = projectBranchScopeData({ data: groupValue, fields: field.fields, scope })

        if (scope.type === 'shared' || Object.keys(nested).length) {
          setValue({ data: output, key: field.name, value: nested })
        }
      } else if (scope.type === 'shared') {
        setValue({ data: output, key: field.name, value: clone({ value }) })
      }

      continue
    }

    if (
      scope.type === 'locale' &&
      !(field.type === 'blocks'
        ? [...field.blocks.values()].some((fields) => hasLocalizedBranchFields({ fields }))
        : hasLocalizedBranchFields({ fields: field.fields }))
    ) {
      continue
    }

    if (!Array.isArray(value)) {
      if (scope.type === 'shared') {
        setValue({ data: output, key: field.name, value: clone({ value }) })
      }

      continue
    }

    const rows = value.map((input: unknown) => {
      const row = getRecord({ value: input })

      if (!row) {
        throw new Error(`Invalid row in branch content field "${field.name}".`)
      }

      const rowFields =
        field.type === 'blocks' ? field.blocks.get(String(row.blockType)) : field.fields

      if (!rowFields) {
        throw new Error(`Unknown block type in branch content field "${field.name}".`)
      }

      const projected = projectBranchScopeData({ data: row, fields: rowFields, scope })

      for (const key of scope.type === 'shared'
        ? ['id', 'blockType', 'blockName']
        : ['id', 'blockType']) {
        if (Object.hasOwn(row, key)) {
          setValue({ data: projected, key, value: clone({ value: row[key] }) })
        }
      }

      return projected
    })

    setValue({ data: output, key: field.name, value: rows })
  }

  return output
}

const clone = ({ value }: { value: unknown }): unknown => structuredClone(value)

const getRecord = ({ value }: { value: unknown }): null | ScopeData =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as ScopeData) : null

const setValue = ({
  data,
  key,
  value,
}: {
  data: ScopeData
  key: string
  value: unknown
}): ScopeData => {
  Object.defineProperty(data, key, { configurable: true, enumerable: true, value, writable: true })

  return data
}
