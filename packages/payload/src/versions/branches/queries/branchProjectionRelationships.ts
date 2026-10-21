import type { Block, Field } from '../../../fields/config/types.js'
import type { BranchHeadID } from '../types.js'

export type BranchProjectionRelationship = {
  collection: string
  logicalID: BranchHeadID
}

/** Enumerates only schema relationships; opaque JSON/editor values never allocate index rows. */
export const collectBranchProjectionRelationships = ({
  blocks = [],
  data,
  fields,
  projectionSlugs,
}: {
  blocks?: Block[]
  data: Record<string, unknown>
  fields: Field[]
  projectionSlugs: Record<string, string>
}): BranchProjectionRelationship[] => {
  const references = new Map<string, BranchProjectionRelationship>()
  const visitFields = ({
    data,
    fields,
    parentIsLocalized,
  }: {
    data: Record<string, unknown>
    fields: Field[]
    parentIsLocalized: boolean
  }): void => {
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if ('name' in tab && tab.name) {
            visitField({ data, field: { ...tab, type: 'group' } as Field, parentIsLocalized })
          } else {
            visitFields({ data, fields: tab.fields, parentIsLocalized })
          }
        }
      } else if (!('name' in field)) {
        if ('fields' in field) {
          visitFields({ data, fields: field.fields, parentIsLocalized })
        }
      } else {
        visitField({ data, field, parentIsLocalized })
      }
    }
  }
  const visitField = ({
    data,
    field,
    parentIsLocalized,
  }: {
    data: Record<string, unknown>
    field: Field
    parentIsLocalized: boolean
  }): void => {
    if (!('name' in field) || !Object.hasOwn(data, field.name)) {
      return
    }

    const value = data[field.name]

    if ('localized' in field && field.localized && !parentIsLocalized && isRecord(value)) {
      for (const localized of Object.values(value)) {
        visitValue({ field, parentIsLocalized: true, value: localized })
      }
    } else {
      visitValue({ field, parentIsLocalized, value })
    }
  }
  const visitValue = ({
    field,
    parentIsLocalized,
    value,
  }: {
    field: Field
    parentIsLocalized: boolean
    value: unknown
  }): void => {
    if (value == null) {
      return
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      for (const item of field.hasMany && Array.isArray(value) ? value : [value]) {
        const collection =
          typeof field.relationTo === 'string'
            ? field.relationTo
            : isRecord(item) && typeof item.relationTo === 'string'
              ? item.relationTo
              : null
        const logicalID =
          typeof field.relationTo === 'string' ? item : isRecord(item) ? item.value : null

        if (collection && projectionSlugs[collection]) {
          if (
            (typeof logicalID !== 'string' || !logicalID.length) &&
            (typeof logicalID !== 'number' || !Number.isFinite(logicalID))
          ) {
            throw new Error('Projection relationship snapshots require unpopulated logical IDs.')
          }

          references.set(JSON.stringify([collection, logicalID]), {
            collection,
            logicalID: logicalID as BranchHeadID,
          })
        }
      }
    } else if ((field.type === 'array' || field.type === 'blocks') && Array.isArray(value)) {
      for (const row of value) {
        if (!isRecord(row)) {
          throw new Error('Invalid branch relationship row.')
        }

        const block =
          field.type === 'blocks'
            ? field.blocks
                .map((reference) =>
                  typeof reference === 'string'
                    ? blocks.find(({ slug }) => slug === reference)
                    : reference,
                )
                .find((block) => block?.slug === row.blockType)
            : null
        const rowFields = field.type === 'array' ? field.fields : block?.fields

        if (!rowFields) {
          throw new Error('Unknown branch relationship block.')
        }

        visitFields({ data: row, fields: rowFields, parentIsLocalized })
      }
    } else if ('fields' in field && isRecord(value)) {
      visitFields({ data: value, fields: field.fields, parentIsLocalized })
    }
  }

  visitFields({ data, fields, parentIsLocalized: false })

  return [...references.values()]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
