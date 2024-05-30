import type { Block } from 'payload/types'

import { sanitizeFields } from 'payload/config'

import type { BlocksFeatureProps } from '.'
import type { PopulationPromise } from '../types'
import type { SerializedBlockNode } from './nodes/BlocksNode'

import { recurseNestedFields } from '../../../populate/recurseNestedFields'

export const blockPopulationPromiseHOC = (
  props: BlocksFeatureProps,
): PopulationPromise<SerializedBlockNode> => {
  const blockPopulationPromise: PopulationPromise<SerializedBlockNode> = ({
    context,
    currentDepth,
    depth,
    editorPopulationPromises,
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

    const promises: Promise<void>[] = []

    // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
    const payloadConfig = req.payload.config
    const validRelationships = payloadConfig.collections.map((c) => c.slug) || []

    blocks.forEach((block) => {
      // @ts-expect-error
      if (!block._sanitized) {
        block.fields = sanitizeFields({
          config: payloadConfig,
          fields: block.fields,
          requireFieldLevelRichTextEditor: true,
          validRelationships,
        })
        // @ts-expect-error
        block._sanitized = true
      }
    })

    // find block used in this node
    const block = props.blocks.find((block) => block.slug === blockFieldData.blockType)
    if (!block || !block?.fields?.length || !blockFieldData) {
      return promises
    }

    recurseNestedFields({
      context,
      currentDepth,
      data: blockFieldData,
      depth,
      draft: false,
      editorPopulationPromises,
      fields: block.fields,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      promises,
      req,
      showHiddenFields,
      // The afterReadPromise gets its data from looking for field.name inside of the siblingDoc. Thus, here we cannot pass the whole document's siblingDoc, but only the siblingDoc (sibling fields) of the current field.
      siblingDoc: blockFieldData,
    })

    return promises
  }

  return blockPopulationPromise
}
