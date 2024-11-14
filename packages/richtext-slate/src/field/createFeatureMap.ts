import type { ClientField } from 'payload'

import type { EnabledFeatures } from './types.js'

export const createFeatureMap = (
  richTextComponentMap: Map<string, ClientField[] | React.ReactNode>,
): EnabledFeatures => {
  const features: EnabledFeatures = {
    elements: {},
    leaves: {},
    plugins: [],
  }

  for (const [key, value] of richTextComponentMap) {
    if (Array.isArray(value)) {
      continue // We only wanna process react nodes here
    }
    if (key.startsWith('leaf.button') || key.startsWith('leaf.component.')) {
      const leafName = key.replace('leaf.button.', '').replace('leaf.component.', '')

      if (!features.leaves[leafName]) {
        features.leaves[leafName] = {
          name: leafName,
          Button: null,
          Leaf: null,
        }
      }

      if (key.startsWith('leaf.button.')) {
        features.leaves[leafName].Button = value
      }
      if (key.startsWith('leaf.component.')) {
        features.leaves[leafName].Leaf = value
      }
    }

    if (key.startsWith('element.button.') || key.startsWith('element.component.')) {
      const elementName = key.replace('element.button.', '').replace('element.component.', '')

      if (!features.elements[elementName]) {
        features.elements[elementName] = {
          name: elementName,
          Button: null,
          Element: null,
        }
      }

      if (key.startsWith('element.button.')) {
        features.elements[elementName].Button = value
      }
      if (key.startsWith('element.component.')) {
        features.elements[elementName].Element = value
      }
    }

    if (key.startsWith('leaf.plugin.') || key.startsWith('element.plugin.')) {
      features.plugins.push(value)
    }
  }

  return features
}
