import { v4 as uuid } from 'uuid'

import type { SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { Copy } from './types.js'

import { branchDocIDField, branchField } from '../branching/types.js'
import { NotFound } from '../errors/NotFound.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { traverseFields } from '../utilities/traverseFields.js'

export const defaultCopy: Copy = async function defaultCopy({
  collection,
  data = {},
  destination,
  req,
  source,
}) {
  const sourceDocument = await this.findOne({
    branch: false,
    collection,
    req,
    where: {
      and: [
        { [branchField]: { equals: source.branch } },
        {
          or: [{ id: { equals: source.id } }, { [branchDocIDField]: { equals: source.id } }],
        },
      ],
    },
  })

  if (!sourceDocument) {
    throw new NotFound(req?.t)
  }

  const { id: _sourceRowID, ...sourceData } = sourceDocument
  const destinationData = copyDataWithFreshRowIDs({
    config: this.payload.config,
    data: {
      ...sourceData,
      ...data,
      [branchDocIDField]: source.id,
      [branchField]: destination.branch,
    },
    fields: this.payload.collections[collection]!.config.fields,
  })

  return this.create({
    collection,
    data: destinationData,
    req,
  })
}

const copyDataWithFreshRowIDs = ({
  config,
  data,
  fields,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  fields: Field[]
}): Record<string, unknown> => {
  const copiedData = deepCopyObjectSimple(data)

  traverseFields({
    callback: ({ field, ref }) => {
      if (
        (field.type !== 'array' && field.type !== 'blocks') ||
        !field.name ||
        !ref ||
        typeof ref !== 'object'
      ) {
        return
      }

      const fieldValue = (ref as Record<string, unknown>)[field.name]
      const assignFreshRowIDs = (rows: unknown) => {
        if (!Array.isArray(rows)) {
          return
        }

        for (const row of rows) {
          if (row && typeof row === 'object') {
            ;(row as Record<string, unknown>).id = uuid()
          }
        }
      }

      if (Array.isArray(fieldValue)) {
        assignFreshRowIDs(fieldValue)
      } else if (fieldValue && typeof fieldValue === 'object') {
        for (const localeValue of Object.values(fieldValue as Record<string, unknown>)) {
          assignFreshRowIDs(localeValue)
        }
      }
    },
    config,
    fields,
    fillEmpty: false,
    ref: copiedData,
  })

  return copiedData
}
