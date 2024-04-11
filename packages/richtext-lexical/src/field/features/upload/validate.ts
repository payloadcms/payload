import { isValidID } from 'payload/utilities'

import type { NodeValidation } from '../types.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

import { CAN_USE_DOM } from '../../lexical/utils/canUseDOM.js'

export const uploadValidation = (): NodeValidation<SerializedUploadNode> => {
  const uploadValidation: NodeValidation<SerializedUploadNode> = ({
    node,
    validation: {
      options: {
        req: { payload, t },
      },
    },
  }) => {
    if (!CAN_USE_DOM) {
      const idType = payload.collections[node.relationTo].customIDType || payload.db.defaultIDType

      if (!isValidID(node.value?.id, idType)) {
        return t('validation:validUploadID')
      }
    }

    // TODO: validate upload collection fields

    return true
  }

  return uploadValidation
}
