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
    siblingDoc,
  }) => {
    const promises: Promise<void>[] = []

    if (node?.fields?.doc?.value?.id && node?.fields?.doc?.relationTo) {
      const collection = req.payload.collections[node?.fields?.doc?.relationTo]

      if (collection) {
        promises.push(
          populate({
            id: node?.fields?.doc?.value?.id,
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
        siblingDoc,
      })
    }
    return promises
  }

  return linkAfterReadPromise
}
