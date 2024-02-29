import type { ResolvedServerFeatureMap, SanitizedServerFeatures } from '../../../features/types'
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types'

import { loadFeatures } from './loader'

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
      afterReadPromises: [],
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
    if (feature.hooks) {
      if (feature.hooks.afterReadPromise) {
        sanitized.hooks.afterReadPromises = sanitized.hooks.afterReadPromises.concat(
          feature.hooks.afterReadPromise,
        )
      }
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
