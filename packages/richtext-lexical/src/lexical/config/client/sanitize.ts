'use client'

import {
  type EditorConfig as LexicalEditorConfig,
  type SerializedTextNode,
  TextNode,
} from 'lexical'

import type {
  ResolvedClientFeatureMap,
  SanitizedClientFeatures,
} from '../../../features/typesClient.js'
import type { LexicalFieldAdminProps } from '../../../types.js'
import type { SanitizedClientEditorConfig } from '../types.js'

class MyTextNode extends TextNode {
  attributes?: Record<string, boolean | null | number | string>

  static clone(node: MyTextNode) {
    return new MyTextNode(node.__text, node.__key)
  }

  static getType() {
    return 'myText' //TextNode.getType()
  }

  createDOM(config: LexicalEditorConfig) {
    const dom = super.createDOM(config)
    // add dashed underline to text with 2px of offset from the text
    dom.style.textDecoration = 'underline'
    dom.style.textDecorationStyle = 'dashed'
    dom.style.textUnderlineOffset = '5px'

    return dom
  }

  // static importJSON(serializedNode: SerializedTextNode): TextNode {
  //   return
  // }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: MyTextNode.getType(),
      // if is defined, add attributes to the JSON
      ...(this.attributes && { attributes: this.attributes }),
    }
  }
}

export const sanitizeClientFeatures = (
  features: ResolvedClientFeatureMap,
): SanitizedClientFeatures => {
  const sanitized: SanitizedClientFeatures = {
    enabledFeatures: [],
    enabledFormats: [],
    markdownTransformers: [],
    nodes: [],
    plugins: [],
    providers: [],
    slashMenu: {
      dynamicGroups: [],
      groups: [],
    },
    toolbarFixed: {
      groups: [],
    },
    toolbarInline: {
      groups: [],
    },
  }

  if (!features?.size) {
    return sanitized
  }

  features.forEach((feature) => {
    if (feature.providers?.length) {
      sanitized.providers = sanitized.providers.concat(feature.providers)
    }

    if (feature.enableFormats?.length) {
      sanitized.enabledFormats.push(...feature.enableFormats)
    }

    if (feature.nodes?.length) {
      // Important: do not use concat
      for (const node of feature.nodes) {
        sanitized.nodes.push(node)
      }
    }
    if (feature.plugins?.length) {
      feature.plugins.forEach((plugin, i) => {
        sanitized.plugins?.push({
          clientProps: feature.sanitizedClientFeatureProps,
          Component: plugin.Component as any, // Appeases strict: true
          key: feature.key + i,
          position: plugin.position,
        })
      })
    }

    if (feature.toolbarInline?.groups?.length) {
      for (const group of feature.toolbarInline.groups) {
        // 1. find the group with the same key or create new one
        let foundGroup = sanitized.toolbarInline.groups.find(
          (sanitizedGroup) => sanitizedGroup.key === group.key,
        )
        if (!foundGroup) {
          foundGroup = {
            ...group,
            items: [],
          }
        } else {
          sanitized.toolbarInline.groups = sanitized.toolbarInline.groups.filter(
            (sanitizedGroup) => sanitizedGroup.key !== group.key,
          )
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (group?.items?.length) {
          foundGroup.items = foundGroup.items.concat(group.items)
        }
        sanitized.toolbarInline?.groups.push(foundGroup)
      }
    }

    if (feature.toolbarFixed?.groups?.length) {
      for (const group of feature.toolbarFixed.groups) {
        // 1. find the group with the same key or create new one
        let foundGroup = sanitized.toolbarFixed.groups.find(
          (sanitizedGroup) => sanitizedGroup.key === group.key,
        )
        if (!foundGroup) {
          foundGroup = {
            ...group,
            items: [],
          }
        } else {
          sanitized.toolbarFixed.groups = sanitized.toolbarFixed.groups.filter(
            (sanitizedGroup) => sanitizedGroup.key !== group.key,
          )
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (group?.items?.length) {
          foundGroup.items = foundGroup.items.concat(group.items)
        }
        sanitized.toolbarFixed?.groups.push(foundGroup)
      }
    }

    if (feature.slashMenu?.groups) {
      if (feature.slashMenu.dynamicGroups?.length) {
        sanitized.slashMenu.dynamicGroups = sanitized.slashMenu.dynamicGroups.concat(
          feature.slashMenu.dynamicGroups,
        )
      }

      for (const optionGroup of feature.slashMenu.groups) {
        // 1. find the group with the same name or create new one
        let group = sanitized.slashMenu.groups.find((group) => group.key === optionGroup.key)
        if (!group) {
          group = {
            ...optionGroup,
            items: [],
          }
        } else {
          sanitized.slashMenu.groups = sanitized.slashMenu.groups.filter(
            (group) => group.key !== optionGroup.key,
          )
        }

        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (optionGroup?.items?.length) {
          group.items = group.items.concat(optionGroup.items)
        }
        sanitized.slashMenu.groups.push(group)
      }
    }

    if (feature.markdownTransformers?.length) {
      // Important: do not use concat
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

  // Sort sanitized.toolbarInline.groups by order property
  sanitized.toolbarInline.groups.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order
    } else if (a.order) {
      return -1
    } else if (b.order) {
      return 1
    } else {
      return 0
    }
  })
  // Sort sanitized.toolbarFixed.groups by order property
  sanitized.toolbarFixed.groups.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order
    } else if (a.order) {
      return -1
    } else if (b.order) {
      return 1
    } else {
      return 0
    }
  })

  // Sort sanitized.toolbarInline.groups.[group].entries by order property
  for (const group of sanitized.toolbarInline.groups) {
    group.items.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order
      } else if (a.order) {
        return -1
      } else if (b.order) {
        return 1
      } else {
        return 0
      }
    })
  }

  // Sort sanitized.toolbarFixed.groups.[group].entries by order property
  for (const group of sanitized.toolbarFixed.groups) {
    group.items.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order
      } else if (a.order) {
        return -1
      } else if (b.order) {
        return 1
      } else {
        return 0
      }
    })
  }

  return sanitized
}

export function sanitizeClientEditorConfig(
  resolvedClientFeatureMap: ResolvedClientFeatureMap,
  lexical?: LexicalEditorConfig,
  admin?: LexicalFieldAdminProps,
): SanitizedClientEditorConfig {
  return {
    admin,
    features: sanitizeClientFeatures(resolvedClientFeatureMap),
    lexical: lexical!,
    resolvedFeatureMap: resolvedClientFeatureMap,
  }
}
