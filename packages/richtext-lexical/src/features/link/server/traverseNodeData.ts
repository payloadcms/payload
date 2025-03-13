import { flattenAllFields } from 'payload'

import type { TraverseNodeData } from '../../typesServer.js'
import type { SerializedLinkNode } from '../nodes/types.js'
import type { LinkFeatureServerProps } from './index.js'

export const traverseNodeDataHOC = (
  props: LinkFeatureServerProps,
): TraverseNodeData<SerializedLinkNode> => {
  return ({ node, onFields }) => {
    if (!props.fields?.length) {
      return
    }

    if (onFields && Array.isArray(props.fields)) {
      onFields({
        data: node.fields,
        fields: flattenAllFields({ fields: props.fields }),
      })
    }
  }
}
