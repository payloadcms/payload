import type { UploadFeatureProps } from '.'
import type { AfterReadPromise } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { populate } from '../../../populate/populate'
import { recurseNestedFields } from '../../../populate/recurseNestedFields'

export const uploadAfterReadPromiseHOC = (
  props?: UploadFeatureProps,
): AfterReadPromise<SerializedUploadNode> => {
  const uploadAfterReadPromise: AfterReadPromise<SerializedUploadNode> = ({
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

    if (node?.fields?.value?.id) {
      const collection = req.payload.collections[node?.fields?.relationTo]

      if (collection) {
        promises.push(
          populate({
            id: node?.fields?.value?.id,
            collection,
            currentDepth,
            data: node.fields,
            depth,
            field,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
      if (Array.isArray(props?.collections?.[node?.fields?.relationTo]?.fields)) {
        recurseNestedFields({
          afterReadPromises,
          currentDepth,
          data: node.fields || {},
          depth,
          fields: props?.collections?.[node?.fields?.relationTo]?.fields,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
        })
      }
    }

    return promises
  }

  return uploadAfterReadPromise
}
