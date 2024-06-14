import type { PopulationPromise } from '../types.js'
import type { BlocksFeatureProps } from './feature.server.js'
import type { SerializedBlockNode } from './nodes/BlocksNode.js'

import { recursivelyPopulateFieldsForGraphQL } from '../../../populateGraphQL/recursivelyPopulateFieldsForGraphQL.js'

export const blockPopulationPromiseHOC = (
  props: BlocksFeatureProps,
): PopulationPromise<SerializedBlockNode> => {
  const blockPopulationPromise: PopulationPromise<SerializedBlockNode> = ({
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
    const block = props.blocks.find((block) => block.slug === blockFieldData.blockType)
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
