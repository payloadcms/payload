import type { Block } from 'payload'

import type { PopulationPromise } from '../../typesServer.js'
import type { SerializedBlockNode, SerializedInlineBlockNode } from './schema.js'

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
    field,
    fieldPromises,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    parentIsLocalized,
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
      parentIsLocalized: parentIsLocalized || field.localized || false,
      populationPromises,
      req,
      showHiddenFields,
      siblingDoc: blockFieldData,
    })
  }

  return blockPopulationPromise
}
