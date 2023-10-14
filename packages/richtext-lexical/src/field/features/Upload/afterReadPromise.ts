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
    siblingDoc,
  }) => {
    const promises: Promise<void>[] = []

    if (node?.value?.id) {
      const collection = req.payload.collections[node?.relationTo]

      if (collection) {
        promises.push(
          populate({
            id: node?.value?.id,
            collection,
            currentDepth,
            data: node,
            depth,
            field,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
      if (Array.isArray(props?.collections?.[node?.relationTo]?.fields)) {
        recurseNestedFields({
          afterReadPromises,
          currentDepth,
          data: node.fields || {},
          depth,
          fields: props?.collections?.[node?.relationTo]?.fields,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
          siblingDoc: node.fields || {},
        })
      }
    }

    return promises
  }

  return uploadAfterReadPromise
}
