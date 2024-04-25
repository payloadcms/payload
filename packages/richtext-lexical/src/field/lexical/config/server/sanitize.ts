import type { ResolvedServerFeatureMap, SanitizedServerFeatures } from '../../../features/types.js'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types.js'

import { loadFeatures } from './loader.js'

export const sanitizeServerFeatures = (
  features: ResolvedServerFeatureMap,
): SanitizedServerFeatures => {
  const sanitized: SanitizedServerFeatures = {
    converters: {
      html: [],
    },
    enabledFeatures: [],

    generatedTypes: {
      modifyOutputSchemas: [],
    },
    hooks: {
      afterChange: new Map(),
      afterRead: new Map(),
      beforeChange: new Map(),
      beforeDuplicate: new Map(),
      beforeValidate: new Map(),
    },
    markdownTransformers: [],
    nodes: [],
    populationPromises: new Map(),

    validations: new Map(),
  }

  if (!features?.size) {
    return sanitized
  }

  features.forEach((feature) => {
    if (feature?.generatedTypes?.modifyOutputSchema) {
      sanitized.generatedTypes.modifyOutputSchemas.push(feature.generatedTypes.modifyOutputSchema)
    }

    if (feature.nodes?.length) {
      sanitized.nodes = sanitized.nodes.concat(feature.nodes)
      feature.nodes.forEach((node) => {
        const nodeType = 'with' in node.node ? node.node.replace.getType() : node.node.getType() // TODO: Idk if this works for node replacements
        if (node?.populationPromises?.length) {
          sanitized.populationPromises.set(nodeType, node.populationPromises)
        }
        if (node?.validations?.length) {
          sanitized.validations.set(nodeType, node.validations)
        }
        if (node?.converters?.html) {
          sanitized.converters.html.push(node.converters.html)
        }
        if (node?.hooks?.afterChange) {
          sanitized.hooks.afterChange.set(nodeType, node.hooks.afterChange)
        }
        if (node?.hooks?.afterRead) {
          sanitized.hooks.afterRead.set(nodeType, node.hooks.afterRead)
        }
        if (node?.hooks?.beforeChange) {
          sanitized.hooks.beforeChange.set(nodeType, node.hooks.beforeChange)
        }
        if (node?.hooks?.beforeDuplicate) {
          sanitized.hooks.beforeDuplicate.set(nodeType, node.hooks.beforeDuplicate)
        }
        if (node?.hooks?.beforeValidate) {
          sanitized.hooks.beforeValidate.set(nodeType, node.hooks.beforeValidate)
        }
      })
    }

    if (feature.markdownTransformers?.length) {
      sanitized.markdownTransformers = sanitized.markdownTransformers.concat(
        feature.markdownTransformers,
      )
    }

    sanitized.enabledFeatures.push(feature.key)
  })

  return sanitized
}

export function sanitizeServerEditorConfig(
  editorConfig: ServerEditorConfig,
): SanitizedServerEditorConfig {
  const resolvedFeatureMap = loadFeatures({
    unSanitizedEditorConfig: editorConfig,
  })

  return {
    features: sanitizeServerFeatures(resolvedFeatureMap),
    lexical: editorConfig.lexical,
    resolvedFeatureMap,
  }
}
