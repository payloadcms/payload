import type { SerializedRelationshipNode } from '../../../../../..'
import type { SlateNodeConverter } from '../types'

export const SlateRelationshipConverter: SlateNodeConverter = {
  converter({ slateNode }) {
    return {
      format: '',
      relationTo: slateNode.relationTo,
      type: 'relationship',
      value: {
        id: slateNode?.value?.id || '',
      },
      version: 1,
    } as const as SerializedRelationshipNode
  },
  nodeTypes: ['relationship'],
}
