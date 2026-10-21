import type { BranchScopeField } from './compileBranchScopeFields.js'

type ScopeData = Record<string, unknown>
type LocaleData = { data: ScopeData; locale: string }

/**
 * Composes selected scope fragments. Shared rows own order and metadata; locale rows
 * attach by typed ID. Structural mismatches fail rather than silently discarding translations.
 */
export const composeBranchScopeData = ({
  fields,
  locales,
  shared,
}: {
  fields: readonly BranchScopeField[]
  locales: readonly LocaleData[]
  shared: ScopeData
}): ScopeData => {
  if (new Set(locales.map(({ locale }) => locale)).size !== locales.length) {
    throw new Error('A locale may only be selected once when composing branch content.')
  }

  const output: ScopeData = {}

  for (const field of fields) {
    const hasSharedValue = Object.hasOwn(shared, field.name)
    const sharedValue = shared[field.name]

    if (field.type === 'value') {
      if (field.isLocalized) {
        const values: ScopeData = {}

        for (const { data, locale } of locales) {
          const localized = getRecord({ value: data[field.name] })

          if (localized && Object.hasOwn(localized, locale)) {
            setValue({ data: values, key: locale, value: structuredClone(localized[locale]) })
          }
        }

        if (Object.keys(values).length) {
          setValue({ data: output, key: field.name, value: values })
        }
      } else if (hasSharedValue) {
        setValue({ data: output, key: field.name, value: structuredClone(sharedValue) })
      }

      continue
    }

    const localeValues = locales.map(({ data, locale }) => ({ locale, value: data[field.name] }))

    if (field.type === 'group') {
      const sharedGroup = getRecord({ value: sharedValue })
      const localeGroups = localeValues.map(({ locale, value }) => ({
        data: getRecord({ value }) ?? {},
        locale,
      }))

      if (hasSharedValue && !sharedGroup) {
        if (localeGroups.some(({ data }) => Object.keys(data).length)) {
          throw new Error(`Incompatible group structure in branch content field "${field.name}".`)
        }

        setValue({ data: output, key: field.name, value: structuredClone(sharedValue) })
      } else if (sharedGroup || localeGroups.some(({ data }) => Object.keys(data).length)) {
        setValue({
          data: output,
          key: field.name,
          value: composeBranchScopeData({
            fields: field.fields,
            locales: localeGroups,
            shared: sharedGroup ?? {},
          }),
        })
      }

      continue
    }

    if (!Array.isArray(sharedValue)) {
      if (localeValues.some(({ value }) => Array.isArray(value) && value.length)) {
        throw new Error(`Missing shared row structure in branch content field "${field.name}".`)
      }

      if (hasSharedValue) {
        setValue({ data: output, key: field.name, value: structuredClone(sharedValue) })
      }

      continue
    }

    const sharedRows = sharedValue.map((value: unknown) => {
      const row = getRecord({ value })

      if (!row) {
        throw new Error(`Invalid shared row in branch content field "${field.name}".`)
      }

      return row
    })
    const translatedRows = localeValues.map(({ locale, value }) => ({
      locale,
      rows: getLocaleRows({ fieldName: field.name, sharedRows, value }),
    }))
    const rows = sharedRows.map((row) => {
      const rowFields =
        field.type === 'blocks' ? field.blocks.get(String(row.blockType)) : field.fields

      if (!rowFields) {
        throw new Error(`Unknown block type in branch content field "${field.name}".`)
      }

      const rowLocales = translatedRows.map(({ locale, rows }) => {
        const translated = rows?.get(row.id as number | string)

        if (translated && field.type === 'blocks' && translated.blockType !== row.blockType) {
          throw new Error(`Incompatible block structure in branch content field "${field.name}".`)
        }

        return { data: translated ?? {}, locale }
      })
      const result = composeBranchScopeData({ fields: rowFields, locales: rowLocales, shared: row })

      for (const key of ['id', 'blockType', 'blockName']) {
        if (Object.hasOwn(row, key)) {
          setValue({ data: result, key, value: structuredClone(row[key]) })
        }
      }

      return result
    })

    setValue({ data: output, key: field.name, value: rows })
  }

  return output
}

const getRecord = ({ value }: { value: unknown }): null | ScopeData =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as ScopeData) : null

const getLocaleRows = ({
  fieldName,
  sharedRows,
  value,
}: {
  fieldName: string
  sharedRows: ScopeData[]
  value: unknown
}): Map<number | string, ScopeData> | null => {
  if (value === undefined) {
    return null
  }

  if (!Array.isArray(value) || value.length !== sharedRows.length) {
    throw new Error(`Incompatible localized row structure in branch content field "${fieldName}".`)
  }

  const sharedIDs = new Set(sharedRows.map((row) => row.id))
  const rows = new Map<number | string, ScopeData>()

  if (sharedIDs.size !== sharedRows.length) {
    throw new Error(`Duplicate shared row identity in branch content field "${fieldName}".`)
  }

  for (const item of value as unknown[]) {
    const row = getRecord({ value: item })
    const id = row?.id

    if (
      !row ||
      (typeof id !== 'string' && typeof id !== 'number') ||
      !sharedIDs.has(id) ||
      rows.has(id)
    ) {
      throw new Error(`Incompatible localized row identity in branch content field "${fieldName}".`)
    }

    rows.set(id, row)
  }

  return rows
}

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
