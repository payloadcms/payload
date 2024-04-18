import type { Data } from 'payload/types'

import {
  type Field,
  type PayloadRequest,
  type TabAsField,
  fieldAffectsData,
  tabHasName,
} from 'payload/types'
import { getDefaultValue } from 'payload/utilities'

import { iterateFields } from './iterateFields.js'

type Args<T> = {
  data: T
  field: Field | TabAsField
  id?: number | string
  req: PayloadRequest
  siblingData: Data
}

export const defaultValuePromise = async <T>({
  id,
  data,
  field,
  req,
  siblingData,
}: Args<T>): Promise<void> => {
  if (fieldAffectsData(field)) {
    if (
      typeof siblingData[field.name] === 'undefined' &&
      typeof field.defaultValue !== 'undefined'
    ) {
      siblingData[field.name] = await getDefaultValue({
        defaultValue: field.defaultValue,
        req,
        value: siblingData[field.name],
      })
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'group': {
      if (typeof siblingData[field.name] !== 'object') siblingData[field.name] = {}

      const groupData = siblingData[field.name] as Record<string, unknown>

      await iterateFields({
        id,
        data,
        fields: field.fields,
        req,
        siblingData: groupData,
      })

      break
    }

    case 'array': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row) => {
          promises.push(
            iterateFields({
              id,
              data,
              fields: field.fields,
              req,
              siblingData: row,
            }),
          )
        })
        await Promise.all(promises)
      }
      break
    }

    case 'blocks': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row) => {
          const blockTypeToMatch = row.blockType
          const block = field.blocks.find((blockType) => blockType.slug === blockTypeToMatch)

          if (block) {
            row.blockType = blockTypeToMatch

            promises.push(
              iterateFields({
                id,
                data,
                fields: block.fields,
                req,
                siblingData: row,
              }),
            )
          }
        })
        await Promise.all(promises)
      }

      break
    }

    case 'row':
    case 'collapsible': {
      await iterateFields({
        id,
        data,
        fields: field.fields,
        req,
        siblingData,
      })

      break
    }

    case 'tab': {
      let tabSiblingData
      if (tabHasName(field)) {
        if (typeof siblingData[field.name] !== 'object') siblingData[field.name] = {}

        tabSiblingData = siblingData[field.name] as Record<string, unknown>
      } else {
        tabSiblingData = siblingData
      }

      await iterateFields({
        id,
        data,
        fields: field.fields,
        req,
        siblingData: tabSiblingData,
      })

      break
    }

    case 'tabs': {
      await iterateFields({
        id,
        data,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        req,
        siblingData,
      })

      break
    }

    default: {
      break
    }
  }
}
