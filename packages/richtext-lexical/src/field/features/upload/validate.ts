import { sanitizeFields } from 'payload/config'
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
    validation,
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

    const collection = props?.collections[node.relationTo]

    if (!collection.fields?.length) {
      return true
    }

    // TODO: Sanitization should happen sometime before this, so that it doesn't need to re-sanitize every time a field is validated
    const validRelationships = config.collections.map((c) => c.slug) || []
    // TODO: Might need a deepCopy. Does it sanitize already-sanitized fields?
    const sanitizedFields = sanitizeFields({
      config,
      fields: collection.fields,
      requireFieldLevelRichTextEditor: true,
      validRelationships,
    })

    for (const field of sanitizedFields) {
      if ('validate' in field && typeof field.validate === 'function' && field.validate) {
        const fieldValue = 'name' in field ? node?.fields?.[field.name] : null

        const validationResult = await field.validate(fieldValue, {
          ...field,
          id: validation.options.id,
          data: fieldValue,
          operation: validation.options.operation,
          req,
          siblingData: node.fields,
        })

        if (validationResult !== true) {
          return validationResult
        }
      }
    }

    return true
  }

  return uploadValidation
}
