import type { PopulationPromise } from '../types.js'
import type { BlocksFeatureProps } from './feature.server.js'
import type { SerializedBlockNode } from './nodes/BlocksNode.js'

import { recurseNestedFields } from '../../../populate/recurseNestedFields.js'

export const blockPopulationPromiseHOC = (
  props: BlocksFeatureProps,
): PopulationPromise<SerializedBlockNode> => {
  const blockPopulationPromise: PopulationPromise<SerializedBlockNode> = ({
    context,
    currentDepth,
    depth,
    editorPopulationPromises,
    fieldPromises,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
    siblingDoc,
  }) => {
    const blockFieldData = node.fields

    // find block used in this node
    const block = props.blocks.find((block) => block.slug === blockFieldData.blockType)
    if (!block || !block?.fields?.length || !blockFieldData) {
      return
    }

    recurseNestedFields({
      context,
      currentDepth,
      data: blockFieldData,
      depth,
      editorPopulationPromises,
      fieldPromises,
      fields: block.fields,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      showHiddenFields,
      // The afterReadPromise gets its data from looking for field.name inside the siblingDoc. Thus, here we cannot pass the whole document's siblingDoc, but only the siblingDoc (sibling fields) of the current field.
      siblingDoc: blockFieldData,
    })
  }

  return blockPopulationPromise
}
