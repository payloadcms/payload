import type { SerializedRelationshipNode } from '../../../../../relationship/nodes/RelationshipNode'
import type { SlateNodeConverter } from '../../types'

export const _SlateRelationshipConverter: SlateNodeConverter = {
  converter({ slateNode }) {
    return {
      type: 'relationship',
      format: '',
      relationTo: slateNode.relationTo,
      value: {
        id: slateNode?.value?.id || '',
      },
      version: 1,
    } as const as SerializedRelationshipNode
  },
  nodeTypes: ['relationship'],
}
