import type { LinkFeatureProps } from '.'
import type { AfterReadPromise } from '../types'
import type { SerializedLinkNode } from './nodes/LinkNode'

import { populate } from '../../../populate/populate'
import { recurseNestedFields } from '../../../populate/recurseNestedFields'

export const linkAfterReadPromiseHOC = (
  props: LinkFeatureProps,
): AfterReadPromise<SerializedLinkNode> => {
  const linkAfterReadPromise: AfterReadPromise<SerializedLinkNode> = ({
    afterReadPromises,
    currentDepth,
    depth,
    field,
    node,
    overrideAccess,
    req,
    showHiddenFields,
  }) => {
    const promises: Promise<void>[] = []

    if (node?.fields?.doc?.value && node?.fields?.doc?.relationTo) {
      const collection = req.payload.collections[node?.fields?.doc?.relationTo]

      if (collection) {
        promises.push(
          populate({
            id: node?.fields?.doc.value,
            collection,
            currentDepth,
            data: node?.fields?.doc,
            depth,
            field,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
    }
    if (Array.isArray(props.fields)) {
      recurseNestedFields({
        afterReadPromises,
        currentDepth,
        data: node.fields || {},
        depth,
        fields: props.fields,
        overrideAccess,
        promises,
        req,
        showHiddenFields,
      })
    }
    return promises
  }

  return linkAfterReadPromise
}
