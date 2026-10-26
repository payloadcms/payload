import type { SanitizedConfig } from '../../../config/types.js'
import type { ArrayField, Block, BlocksField, Field } from '../../../fields/config/types.js'

import { tabHasName } from '../../../fields/config/types.js'
import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'
import { traverseFields } from '../../../utilities/traverseFields.js'

type LevelEntry =
  | { field: ArrayField | BlocksField; localized: boolean; type: 'rows' }
  | { fields: Field[]; localized: boolean; type: 'subfields' }

const buildLevelMap = (fields: Field[], map: Map<string, LevelEntry> = new Map()) => {
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      buildLevelMap(field.fields, map)
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (tabHasName(tab)) {
          map.set(tab.name, {
            type: 'subfields',
            fields: tab.fields,
            localized: Boolean(tab.localized),
          })
        } else {
          buildLevelMap(tab.fields, map)
        }
      }
    } else if (field.type === 'group') {
      if ('name' in field && field.name) {
        map.set(field.name, {
          type: 'subfields',
          fields: field.fields,
          localized: Boolean(field.localized),
        })
      } else {
        buildLevelMap(field.fields, map)
      }
    } else if ((field.type === 'array' || field.type === 'blocks') && field.name) {
      map.set(field.name, { type: 'rows', field, localized: Boolean(field.localized) })
    }
  }
  return map
}

const isLocaleKeyed = (value: object, config: SanitizedConfig): boolean => {
  if (Array.isArray(value)) {
    return false
  }
  const localeCodes = config.localization ? config.localization.localeCodes : []
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => localeCodes.includes(key))
}

const resolveBlockFields = (
  field: BlocksField,
  blockType: unknown,
  config: SanitizedConfig,
): Field[] => {
  if (typeof blockType !== 'string') {
    return []
  }
  const block =
    config.blocks?.find((b) => b.slug === blockType) ??
    field.blocks.find((b): b is Block => typeof b !== 'string' && b.slug === blockType)
  return block?.fields ?? []
}

const copyRow = ({
  config,
  existingRowIDs,
  field,
  parentIsLocalized,
  row,
}: {
  config: SanitizedConfig
  existingRowIDs: Set<string>
  field: ArrayField | BlocksField
  parentIsLocalized: boolean
  row: unknown
}): unknown => {
  if (!row || typeof row !== 'object') {
    return deepCopyObjectSimple(row as never)
  }

  const subfields =
    field.type === 'array'
      ? field.fields
      : resolveBlockFields(field, (row as Record<string, unknown>).blockType, config)

  const newRow = copyObject({
    config,
    data: row as Record<string, unknown>,
    existingRowIDs,
    fields: subfields,
    parentIsLocalized,
  })

  if (typeof newRow.id === 'string' && !existingRowIDs.has(newRow.id)) {
    delete newRow.id
  }

  return newRow
}

const copyObject = ({
  config,
  data,
  existingRowIDs,
  fields,
  parentIsLocalized,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  existingRowIDs: Set<string>
  fields: Field[]
  parentIsLocalized: boolean
}): Record<string, unknown> => {
  const levelMap = buildLevelMap(fields)
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(data)) {
    const value = data[key]
    const entry = levelMap.get(key)

    if (!entry || value === null || typeof value !== 'object') {
      result[key] = deepCopyObjectSimple(value as never)
      continue
    }

    const childParentIsLocalized = parentIsLocalized || entry.localized

    if (entry.type === 'subfields') {
      const valueIsLocaleKeyed =
        entry.localized && !parentIsLocalized && isLocaleKeyed(value, config)

      result[key] = valueIsLocaleKeyed
        ? mapLocales(value, (localeValue) =>
            copyObject({
              config,
              data: localeValue,
              existingRowIDs,
              fields: entry.fields,
              parentIsLocalized: true,
            }),
          )
        : copyObject({
            config,
            data: value as Record<string, unknown>,
            existingRowIDs,
            fields: entry.fields,
            parentIsLocalized: childParentIsLocalized,
          })
      continue
    }

    const copyRows = (rows: unknown) =>
      Array.isArray(rows)
        ? rows.map((row) =>
            copyRow({
              config,
              existingRowIDs,
              field: entry.field,
              parentIsLocalized: childParentIsLocalized,
              row,
            }),
          )
        : deepCopyObjectSimple(rows as never)

    result[key] = Array.isArray(value) ? copyRows(value) : mapLocales(value, copyRows)
  }

  return result
}

const mapLocales = (
  value: object,
  copyLocaleValue: (localeValue: Record<string, unknown>) => unknown,
): unknown => {
  if (Array.isArray(value)) {
    return deepCopyObjectSimple(value as never)
  }
  const out: Record<string, unknown> = {}
  for (const locale of Object.keys(value)) {
    const localeValue = (value as Record<string, unknown>)[locale]
    out[locale] =
      localeValue && typeof localeValue === 'object'
        ? copyLocaleValue(localeValue as Record<string, unknown>)
        : deepCopyObjectSimple(localeValue as never)
  }
  return out
}

const collectExistingRowIDs = ({
  config,
  existingDoc,
  fields,
}: {
  config: SanitizedConfig
  existingDoc: Record<string, unknown>
  fields: Field[]
}): Set<string> => {
  const existingRowIDs = new Set<string>()

  traverseFields({
    callback: ({ field, ref }) => {
      if (
        (field.type !== 'array' && field.type !== 'blocks') ||
        !('name' in field) ||
        !field.name ||
        !ref ||
        typeof ref !== 'object'
      ) {
        return
      }

      const value = (ref as Record<string, unknown>)[field.name]

      const visitRows = (rows: unknown) => {
        if (!Array.isArray(rows)) {
          return
        }
        for (const row of rows) {
          if (
            row &&
            typeof row === 'object' &&
            typeof (row as Record<string, unknown>).id === 'string'
          ) {
            existingRowIDs.add((row as Record<string, unknown>).id as string)
          }
        }
      }

      if (Array.isArray(value)) {
        visitRows(value)
      } else if (value && typeof value === 'object') {
        for (const localeValue of Object.values(value as Record<string, unknown>)) {
          visitRows(localeValue)
        }
      }
    },
    config,
    fields,
    fillEmpty: false,
    ref: existingDoc,
  })

  return existingRowIDs
}

export const copyDataWithFreshRowIDs = ({
  config,
  data,
  existingDoc,
  fields,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  existingDoc: Record<string, unknown>
  fields: Field[]
}): Record<string, unknown> => {
  const existingRowIDs = collectExistingRowIDs({ config, existingDoc, fields })

  return copyObject({
    config,
    data,
    existingRowIDs,
    fields,
    parentIsLocalized: false,
  })
}
