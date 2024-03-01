import type { SerializedUploadNode } from '../../../../../..'
import type { SlateNodeConverter } from '../types'

export const SlateUploadConverter: SlateNodeConverter = {
  converter({ slateNode }) {
    return {
      type: 'upload',
      fields: {
        ...slateNode.fields,
      },
      format: '',
      relationTo: slateNode.relationTo,
      value: {
        id: slateNode.value?.id || '',
      },
      version: 1,
    } as const as SerializedUploadNode
  },
  nodeTypes: ['upload'],
}
