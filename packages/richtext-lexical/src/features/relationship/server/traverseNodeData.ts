import type { TraverseNodeData } from '../../typesServer.js'
import type { SerializedRelationshipNode } from './nodes/RelationshipNode.js'

export const traverseNodeData: TraverseNodeData<SerializedRelationshipNode> = ({
  node,
  onRelationship,
}) => {
  if (node?.value) {
    // @ts-expect-error
    const id = node?.value?.id || node?.value // for backwards-compatibility

    if (node?.relationTo && onRelationship) {
      onRelationship({
        id,
        collectionSlug: node.relationTo,
      })
    }
  }
}
