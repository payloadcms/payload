import { fieldAffectsData } from 'payload/types'
import { getIDType, isValidID } from 'payload/utilities'

import type { NodeValidation } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { CAN_USE_DOM } from '../../lexical/utils/canUseDOM'

export const uploadValidation = (): NodeValidation<SerializedUploadNode> => {
  const uploadValidation: NodeValidation<SerializedUploadNode> = async ({
    node,
    payloadConfig,
    validation,
  }) => {
    if (!CAN_USE_DOM) {
      const idField = payloadConfig.collections
        .find(({ slug }) => slug === node.relationTo)
        .fields.find((field) => fieldAffectsData(field) && field.name === 'id')

      const type = getIDType(idField, validation?.options?.payload?.db?.defaultIDType)

      if (!isValidID(node.value?.id, type)) {
        return validation.options.t('validation:validUploadID')
      }
    }

    // TODO: validate upload collection fields

    return true
  }

  return uploadValidation
}
