import type { SerializedUploadNode } from '../../../../../upload/nodes/UploadNode.js'
import type { SlateNodeConverter } from '../../types.js'

export const _SlateUploadConverter: SlateNodeConverter = {
  converter({ slateNode }) {
    return {
      type: 'upload',
      fields: {
        ...slateNode.fields,
      },
      format: '',
      relationTo: slateNode.relationTo,
      value: slateNode.value?.id || '',
      version: 2,
    } as const as SerializedUploadNode
  },
  nodeTypes: ['upload'],
}
