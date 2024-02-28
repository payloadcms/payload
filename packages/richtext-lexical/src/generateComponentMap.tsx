import type { RichTextAdapter } from 'payload/types'

import React from 'react'

import type { ResolvedFeatureMap } from './field/features/types'

export const getGenerateComponentMap =
  (args: { resolvedFeatureMap: ResolvedFeatureMap }): RichTextAdapter['generateComponentMap'] =>
  ({ config }) => {
    const componentMap = new Map()

    console.log('args.resolvedFeatureMap', args.resolvedFeatureMap)

    for (const key of args.resolvedFeatureMap.keys()) {
      console.log('key', key)
      const resolvedFeature = args.resolvedFeatureMap.get(key)
      const Component = resolvedFeature.Component
      componentMap.set(`feature.${key}`, <Component />)
    }

    console.log('componentMaaap', componentMap)
    return componentMap
  }
