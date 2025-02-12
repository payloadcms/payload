import type { SanitizedConfig } from 'payload'

import type {
  ResolvedServerFeatureMap,
  SanitizedServerFeatures,
} from '../../../features/typesServer.js'
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
      afterChange: [],
      afterRead: [],
      beforeChange: [],
      beforeValidate: [],
    },
    i18n: {},
    markdownTransformers: [],
    nodeHooks: {
      afterChange: new Map(),
      afterRead: new Map(),
      beforeChange: new Map(),
      beforeValidate: new Map(),
    },
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

    if (feature?.hooks?.beforeValidate?.length) {
      sanitized.hooks.beforeValidate = sanitized.hooks.beforeValidate?.concat(
        feature.hooks.beforeValidate,
      )
    }
    if (feature?.hooks?.beforeChange?.length) {
      sanitized.hooks.beforeChange = sanitized.hooks.beforeChange?.concat(
        feature.hooks.beforeChange,
      )
    }
    if (feature?.hooks?.afterRead?.length) {
      sanitized.hooks.afterRead = sanitized.hooks.afterRead?.concat(feature.hooks.afterRead)
    }
    if (feature?.hooks?.afterChange?.length) {
      sanitized.hooks.afterChange = sanitized.hooks.afterChange?.concat(feature.hooks.afterChange)
    }

    if (feature?.i18n) {
      for (const lang in feature.i18n) {
        if (!sanitized.i18n[lang as keyof typeof sanitized.i18n]) {
          sanitized.i18n[lang as keyof typeof sanitized.i18n] = {
            lexical: {},
          }
        }
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        sanitized.i18n[lang].lexical[feature.key] = feature.i18n[lang]
      }
    }

    if (feature.nodes?.length) {
      // Do not concat here. We need to keep the object reference of sanitized.nodes so that function markdown transformers of features automatically get the updated nodes
      for (const node of feature.nodes) {
        sanitized.nodes.push(node)
      }
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
          sanitized.nodeHooks?.afterChange?.set(nodeType, node.hooks.afterChange)
        }
        if (node?.hooks?.afterRead) {
          sanitized.nodeHooks?.afterRead?.set(nodeType, node.hooks.afterRead)
        }
        if (node?.hooks?.beforeChange) {
          sanitized.nodeHooks?.beforeChange?.set(nodeType, node.hooks.beforeChange)
        }
        if (node?.hooks?.beforeValidate) {
          sanitized.nodeHooks?.beforeValidate?.set(nodeType, node.hooks.beforeValidate)
        }
        if (node?.getSubFields) {
          sanitized.getSubFields?.set(nodeType, node.getSubFields)
        }
        if (node?.getSubFieldsData) {
          sanitized.getSubFieldsData?.set(nodeType, node.getSubFieldsData)
        }
      })
    }

    if (feature.markdownTransformers?.length) {
      // Do not concat here. We need to keep the object reference of feature.markdownTransformers

      for (const transformer of feature.markdownTransformers) {
        if (typeof transformer === 'function') {
          sanitized.markdownTransformers.push(
            transformer({
              allNodes: sanitized.nodes,
              allTransformers: sanitized.markdownTransformers,
            }),
          )
        } else {
          sanitized.markdownTransformers.push(transformer)
        }
      }
    }

    sanitized.enabledFeatures.push(feature.key)
  })

  return sanitized
}

export async function sanitizeServerEditorConfig(
  editorConfig: ServerEditorConfig,
  config: SanitizedConfig,
  parentIsLocalized?: boolean,
): Promise<SanitizedServerEditorConfig> {
  const resolvedFeatureMap = await loadFeatures({
    config,
    parentIsLocalized: parentIsLocalized!,
    unSanitizedEditorConfig: editorConfig,
  })

  return {
    features: sanitizeServerFeatures(resolvedFeatureMap),
    lexical: editorConfig.lexical!,
    resolvedFeatureMap,
  }
}
