import type { Block, Field } from '../../../fields/config/types.js'
import type { SelectMode, SelectType } from '../../../types/index.js'

import { getSelectMode } from '../../../utilities/getSelectMode.js'

/** Apply the established recursive Select API after private identity metadata is removed. */
export const selectBranchQueryData = ({
  blocks,
  data,
  fields,
  parentIsLocalized = false,
  select,
  selectMode,
}: {
  blocks?: Block[]
  data: Record<string, unknown>
  fields?: Field[]
  parentIsLocalized?: boolean
  select?: SelectType
  selectMode?: SelectMode
}): Record<string, unknown> => {
  if (!select) {
    return data
  }
  const mode = selectMode ?? getSelectMode(select)

  return Object.fromEntries(
    Object.entries(data)
      .filter(
        ([key]) =>
          key === 'id' || (mode === 'include' ? Boolean(select[key]) : select[key] !== false),
      )
      .map(([key, value]) => {
        const nested = select[key]
        if (!nested || typeof nested !== 'object') {
          return [key, value]
        }
        const field = findField({ fields, key })
        if (field?.type === 'relationship' || field?.type === 'upload') {
          return [key, value]
        }
        const isLocalized = Boolean(field && 'localized' in field && field.localized)
        const descend = (value: unknown): unknown => {
          if (Array.isArray(value)) {
            return value.map(descend)
          }
          if (!value || typeof value !== 'object') {
            return value
          }
          let childSelect = nested
          let childMode = mode
          let children = field && 'fields' in field ? field.fields : undefined
          if (field?.type === 'blocks') {
            const block = field.blocks.find(
              (candidate) =>
                (typeof candidate === 'string' ? candidate : candidate.slug) ===
                (value as Record<string, unknown>).blockType,
            )
            children = (
              typeof block === 'string' ? blocks?.find(({ slug }) => slug === block) : block
            )?.fields
            const selected = nested[String((value as Record<string, unknown>).blockType)]
            if (selected === true || (mode === 'exclude' && selected === undefined)) {
              return value
            }
            if (selected === false || selected === undefined) {
              childMode = 'include'
              childSelect = {}
            } else {
              childSelect = selected as SelectType
            }
            if (childMode === 'include') {
              childSelect = { ...childSelect, id: true, blockType: true }
            }
          }
          return selectBranchQueryData({
            blocks,
            data: value as Record<string, unknown>,
            fields: children,
            parentIsLocalized: parentIsLocalized || isLocalized,
            select: childSelect,
            selectMode: childMode,
          })
        }
        return [
          key,
          isLocalized &&
          !parentIsLocalized &&
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
            ? Object.fromEntries(
                Object.entries(value).map(([locale, localized]) => [locale, descend(localized)]),
              )
            : descend(value),
        ]
      }),
  )
}

const findField = ({ fields = [], key }: { fields?: Field[]; key: string }): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === key) {
      return field
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name === key) {
          return { ...tab, type: 'group' }
        }
        if (!('name' in tab)) {
          const found = findField({ fields: tab.fields, key })
          if (found) {
            return found
          }
        }
      }
    } else if (!('name' in field) && 'fields' in field) {
      const found = findField({ fields: field.fields, key })
      if (found) {
        return found
      }
    }
  }
}
