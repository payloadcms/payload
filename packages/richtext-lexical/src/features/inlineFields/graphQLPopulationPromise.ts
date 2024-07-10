import type { PopulationPromise } from '../typesServer.js'
import type { InlineFieldsFeatureProps } from './feature.server.js'
import type { SerializedInlineFieldsNode } from './nodes/InlineFieldsNode.js'

import { recursivelyPopulateFieldsForGraphQL } from '../../populateGraphQL/recursivelyPopulateFieldsForGraphQL.js'

export const inlineFieldsPopulationPromiseHOC = (
  props: InlineFieldsFeatureProps,
): PopulationPromise<SerializedInlineFieldsNode> => {
  const inlineFieldsPopulationPromise: PopulationPromise<SerializedInlineFieldsNode> = ({
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
    const inlineFieldsData = node.fields

    // find inlineFields used in this node
    const inlineFields = props.inlineFields.find((inlineFields) => inlineFields.key === node.key)
    if (!inlineFields || !inlineFields?.fields?.length || !inlineFieldsData) {
      return
    }

    recursivelyPopulateFieldsForGraphQL({
      context,
      currentDepth,
      data: inlineFieldsData,
      depth,
      draft,
      editorPopulationPromises,
      fieldPromises,
      fields: inlineFields.fields,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      showHiddenFields,
      siblingDoc: inlineFieldsData,
    })
  }

  return inlineFieldsPopulationPromise
}
