import type { SerializedUploadNode } from '../../../../../..'
import type { SlateNodeConverter } from '../types'

export const SlateUploadConverter: SlateNodeConverter = {
  converter({ slateNode }) {
    return {
      fields: {
        ...slateNode.fields,
      },
      format: '',
      relationTo: slateNode.relationTo,
      type: 'upload',
      value: {
        id: slateNode.value?.id || '',
      },
      version: 1,
    } as const as SerializedUploadNode
  },
  nodeTypes: ['upload'],
}
