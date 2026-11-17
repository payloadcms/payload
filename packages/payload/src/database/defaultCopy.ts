import { v4 as uuid } from 'uuid'

import type { SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { Copy } from './types.js'

import { NotFound } from '../errors/NotFound.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { traverseFields } from '../utilities/traverseFields.js'

export const defaultCopy: Copy = async function defaultCopy({ collection, data = {}, req, where }) {
  const collectionConfig = this.payload.collections[collection]!
  const { customIDType } = collectionConfig
  const hasValidCustomID =
    customIDType === 'number' ? typeof data.id === 'number' : typeof data.id === 'string'

  if (customIDType && !hasValidCustomID) {
    throw new TypeError(
      `Database copy for collection "${collection}" requires data.id to match its custom ${customIDType} ID type`,
    )
  }

  const sourceDocument = await this.findOne({
    collection,
    req,
    where,
  })

  if (!sourceDocument) {
    throw new NotFound(req?.t)
  }

  const { id: _sourceID, ...sourceData } = sourceDocument
  const copiedData = copyDataWithFreshRowIDs({
    config: this.payload.config,
    data: {
      ...sourceData,
      ...data,
    },
    fields: collectionConfig.config.fields,
  })

  return this.create({
    collection,
    ...(customIDType ? { customID: data.id as number | string } : {}),
    data: copiedData,
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
