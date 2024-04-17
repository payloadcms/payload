import type { Block } from 'payload/types'

import { sanitizeFields } from 'payload/config'

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
    const blocks: Block[] = props.blocks
    const blockFieldData = node.fields

    // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
    const payloadConfig = req.payload.config
    const validRelationships = payloadConfig.collections.map((c) => c.slug) || []
    blocks.forEach((block) => {
      block.fields = sanitizeFields({
        config: payloadConfig,
        fields: block.fields,
        requireFieldLevelRichTextEditor: true,
        validRelationships,
      })
    })

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
