import type { PopulationPromise } from '../types.js'
import type { LinkFeatureServerProps } from './feature.server.js'
import type { SerializedLinkNode } from './nodes/types.js'

import { recursivelyPopulateFieldsForGraphQL } from '../../../populateGraphQL/recursivelyPopulateFieldsForGraphQL.js'

export const linkPopulationPromiseHOC = (
  props: LinkFeatureServerProps,
): PopulationPromise<SerializedLinkNode> => {
  return ({
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
    if (!props.fields?.length) {
      return
    }

    /**
     * Should populate all fields, including the doc field (for internal links), as it's treated like a normal field
     */
    if (Array.isArray(props.fields)) {
      recursivelyPopulateFieldsForGraphQL({
        context,
        currentDepth,
        data: node.fields,
        depth,
        draft,
        editorPopulationPromises,
        fieldPromises,
        fields: props.fields,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        showHiddenFields,
        siblingDoc: node.fields,
      })
    }
  }
}
