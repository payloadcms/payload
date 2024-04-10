import { fieldAffectsData } from 'payload/types'
import { getIDType, isValidID } from 'payload/utilities'

import type { NodeValidation } from '../types.js'
import type { UploadFeatureProps } from './feature.server.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

export const uploadValidation = (
  props: UploadFeatureProps,
): NodeValidation<SerializedUploadNode> => {
  const uploadValidation: NodeValidation<SerializedUploadNode> = async ({
    node,
    validation: {
      options: {
        req,
        req: {
          payload: { config, db },
          t,
        },
      },
    },
  }) => {
    const idField = config.collections
      .find(({ slug }) => slug === node.relationTo)
      .fields.find((field) => fieldAffectsData(field) && field.name === 'id')

    const type = getIDType(idField, db?.defaultIDType)

    if (!isValidID(node.value?.id, type)) {
      return t('validation:validUploadID')
    }

    if (Object.keys(props?.collections).length === 0) {
      return true
    }

    for (const collection in props?.collections) {
      if (!props?.collections?.[collection]?.fields?.length) {
        continue
      }
      for (const field of props.collections[collection].fields) {
        if ('validate' in field && typeof field.validate === 'function' && field.validate) {
          const fieldValue = 'name' in field ? node.fields[field.name] : null

          const validationResult = await field.validate(fieldValue, {
            ...field,
            id: node.value?.id,
            data: fieldValue,
            operation: 'update',
            req,
            siblingData: {},
          })

          if (validationResult !== true) {
            return validationResult
          }
        }
      }
    }

    return true
  }

  return uploadValidation
}
