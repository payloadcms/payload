import type { LinkFeatureProps } from '.'
import type { PopulationPromise } from '../types'
import type { SerializedLinkNode } from './nodes/LinkNode'

import { populate } from '../../../populate/populate'
import { recurseNestedFields } from '../../../populate/recurseNestedFields'

export const linkPopulationPromiseHOC = (
  props: LinkFeatureProps,
): PopulationPromise<SerializedLinkNode> => {
  const linkPopulationPromise: PopulationPromise<SerializedLinkNode> = ({
    currentDepth,
    depth,
    field,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
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
        currentDepth,
        data: node.fields || {},
        depth,
        fields: props.fields,
        overrideAccess,
        populationPromises,
        promises,
        req,
        showHiddenFields,
        siblingDoc: node.fields || {},
      })
    }
    return promises
  }

  return linkPopulationPromise
}
