import { fieldAffectsData } from 'payload/types'
import { getIDType, isValidID } from 'payload/utilities'

import type { NodeValidation } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { CAN_USE_DOM } from '../../lexical/utils/canUseDOM'

export const uploadValidation = (): NodeValidation<SerializedUploadNode> => {
  const uploadValidation: NodeValidation<SerializedUploadNode> = ({
    node,
    validation: {
      options: {
        req: {
          payload: { config, db },
          t,
        },
      },
    },
  }) => {
    if (!CAN_USE_DOM) {
      const idField = config.collections
        .find(({ slug }) => slug === node.relationTo)
        .fields.find((field) => fieldAffectsData(field) && field.name === 'id')

      const type = getIDType(idField, db?.defaultIDType)

      if (!isValidID(node.value?.id, type)) {
        return t('validation:validUploadID')
      }
    }

    // TODO: validate upload collection fields

    return true
  }

  return uploadValidation
}
