import { sanitizeFields } from 'payload/config'

import type { BlocksFeatureProps } from '.'
import type { AfterReadPromise } from '../types'
import type { SerializedBlockNode } from './nodes/BlocksNode'

import { recurseNestedFields } from '../../../populate/recurseNestedFields'

export const blockAfterReadPromiseHOC = (
  props: BlocksFeatureProps,
): AfterReadPromise<SerializedBlockNode> => {
  const blockAfterReadPromise: AfterReadPromise<SerializedBlockNode> = ({
    afterReadPromises,
    currentDepth,
    depth,
    field,
    node,
    overrideAccess,
    req,
    showHiddenFields,
    siblingDoc,
  }) => {
    const promises: Promise<void>[] = []

    // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
    const payloadConfig = req.payload.config
    const validRelationships = payloadConfig.collections.map((c) => c.slug) || []
    props.blocks = props.blocks.map((block) => {
      const unsanitizedBlock = { ...block }
      unsanitizedBlock.fields = sanitizeFields({
        config: payloadConfig,
        fields: block.fields,
        validRelationships,
      })
      return unsanitizedBlock
    })

    if (Array.isArray(props.blocks)) {
      props.blocks.forEach((block) => {
        if (block?.fields) {
          recurseNestedFields({
            afterReadPromises,
            currentDepth,
            data: node.fields.data || {},
            depth,
            fields: block.fields,
            overrideAccess,
            promises,
            req,
            showHiddenFields,
            siblingDoc,
          })
        }
      })
    }

    return promises
  }

  return blockAfterReadPromise
}
