import type { SanitizedConfig } from 'payload'

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
    getSubFields: new Map(),
    getSubFieldsData: new Map(),
    graphQLPopulationPromises: new Map(),
    hooks: {
      afterChange: new Map(),
      afterRead: new Map(),
      beforeChange: new Map(),
      beforeValidate: new Map(),
    },
    i18n: {},
    markdownTransformers: [],
    nodes: [],

    validations: new Map(),
  }

  if (!features?.size) {
    return sanitized
  }

  features.forEach((feature) => {
    if (feature?.generatedTypes?.modifyOutputSchema) {
      sanitized.generatedTypes.modifyOutputSchemas.push(feature.generatedTypes.modifyOutputSchema)
    }

    if (feature?.i18n) {
      for (const lang in feature.i18n) {
        if (!sanitized.i18n[lang]) {
          sanitized.i18n[lang] = {
            lexical: {},
          }
        }
        sanitized.i18n[lang].lexical[feature.key] = feature.i18n[lang]
      }
    }

    if (feature.nodes?.length) {
      sanitized.nodes = sanitized.nodes.concat(feature.nodes)
      feature.nodes.forEach((node) => {
        const nodeType = 'with' in node.node ? node.node.replace.getType() : node.node.getType() // TODO: Idk if this works for node replacements
        if (node?.graphQLPopulationPromises?.length) {
          sanitized.graphQLPopulationPromises.set(nodeType, node.graphQLPopulationPromises)
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
        if (node?.hooks?.beforeValidate) {
          sanitized.hooks.beforeValidate.set(nodeType, node.hooks.beforeValidate)
        }
        if (node?.getSubFields) {
          sanitized.getSubFields.set(nodeType, node.getSubFields)
        }
        if (node?.getSubFieldsData) {
          sanitized.getSubFieldsData.set(nodeType, node.getSubFieldsData)
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

export async function sanitizeServerEditorConfig(
  editorConfig: ServerEditorConfig,
  config: SanitizedConfig,
): Promise<SanitizedServerEditorConfig> {
  const resolvedFeatureMap = await loadFeatures({
    config,
    unSanitizedEditorConfig: editorConfig,
  })

  return {
    features: sanitizeServerFeatures(resolvedFeatureMap),
    lexical: editorConfig.lexical,
    resolvedFeatureMap,
  }
}
