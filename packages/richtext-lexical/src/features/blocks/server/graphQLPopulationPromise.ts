import type { Block } from 'payload'

import type { PopulationPromise } from '../../typesServer.js'
import type { SerializedInlineBlockNode } from '../client/nodes/InlineBlocksNode.js'
import type { SerializedBlockNode } from './nodes/BlocksNode.js'

import { recursivelyPopulateFieldsForGraphQL } from '../../../populateGraphQL/recursivelyPopulateFieldsForGraphQL.js'

export const blockPopulationPromiseHOC = (
  blocks: Block[],
): PopulationPromise<SerializedBlockNode | SerializedInlineBlockNode> => {
  const blockPopulationPromise: PopulationPromise<
    SerializedBlockNode | SerializedInlineBlockNode
  > = ({
    context,
    currentDepth,
    depth,
    draft,
    editorPopulationPromises,
    fieldPromises,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
  }) => {
    const blockFieldData = node.fields

    // find block used in this node
    const block = blocks.find((block) => block.slug === blockFieldData.blockType)
    if (!block || !block?.fields?.length || !blockFieldData) {
      return
    }

    recursivelyPopulateFieldsForGraphQL({
      context,
      currentDepth,
      data: blockFieldData,
      depth,
      draft,
      editorPopulationPromises,
      fieldPromises,
      fields: block.fields,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      showHiddenFields,
      siblingDoc: blockFieldData,
    })
  }

  return blockPopulationPromise
}
