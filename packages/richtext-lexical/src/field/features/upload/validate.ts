import { isValidID } from 'payload/utilities'

import type { NodeValidation } from '../types.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

import { CAN_USE_DOM } from '../../lexical/utils/canUseDOM.js'

export const uploadValidation = (): NodeValidation<SerializedUploadNode> => {
  return ({
    node,
    validation: {
      options: {
        req: { payload, t },
      },
    },
  }) => {
    if (!CAN_USE_DOM) {
      const idType = payload.collections[node.relationTo].customIDType || payload.db.defaultIDType
      // @ts-expect-error
      const id = node?.value?.id || node?.value // for backwards-compatibility

      if (!isValidID(id, idType)) {
        return t('validation:validUploadID')
      }
    }

    // TODO: validate upload collection fields

    return true
  }
}
