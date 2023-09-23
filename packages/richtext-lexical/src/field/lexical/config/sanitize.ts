import type { Feature, SanitizedFeatures } from '../../features/types'
import type { EditorConfig, SanitizedEditorConfig } from './types'

export const sanitizeFeatures = (features: Feature[]): SanitizedFeatures => {
  const sanitized: SanitizedFeatures = {
    floatingSelectToolbar: {
      buttons: {
        format: [],
      },
    },
    markdownTransformers: [],
    nodes: [],
    plugins: [],
    slashMenu: {
      dynamicOptions: [],
      groupsWithOptions: [],
    },
  }

  features.forEach((feature) => {
    if (feature.nodes?.length) {
      sanitized.nodes = sanitized.nodes.concat(feature.nodes)
    }
    if (feature.plugins?.length) {
      sanitized.plugins = sanitized.plugins.concat(feature.plugins)
    }
    if (feature.markdownTransformers?.length) {
      sanitized.markdownTransformers = sanitized.markdownTransformers.concat(
        feature.markdownTransformers,
      )
    }

    if (feature.floatingSelectToolbar?.buttons?.format?.length) {
      sanitized.floatingSelectToolbar.buttons.format =
        sanitized.floatingSelectToolbar.buttons.format.concat(
          feature.floatingSelectToolbar.buttons.format,
        )
    }

    if (feature.slashMenu?.options) {
      if (feature.slashMenu.dynamicOptions?.length) {
        sanitized.slashMenu.dynamicOptions = sanitized.slashMenu.dynamicOptions.concat(
          feature.slashMenu.dynamicOptions,
        )
      }

      for (const optionGroup of feature.slashMenu.options) {
        // 1. find the group with the same name or create new one
        let group = sanitized.slashMenu.groupsWithOptions.find(
          (group) => group.title === optionGroup.title,
        )
        if (!group) {
          group = {
            ...optionGroup,
            options: [],
          }
        } else {
          sanitized.slashMenu.groupsWithOptions = sanitized.slashMenu.groupsWithOptions.filter(
            (group) => group.title !== optionGroup.title,
          )
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (optionGroup?.options?.length) {
          group.options = group.options.concat(optionGroup.options)
        }
        sanitized.slashMenu.groupsWithOptions.push(group)
      }
    }
  })

  return sanitized
}

export function sanitizeEditorConfig(editorConfig: EditorConfig): SanitizedEditorConfig {
  return {
    features: sanitizeFeatures(editorConfig.features),
    lexical: editorConfig.lexical,
  }
}
