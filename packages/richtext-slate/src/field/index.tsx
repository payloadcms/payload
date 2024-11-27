'use client'

import { ShimmerEffect, useClientFunctions } from '@payloadcms/ui'
import React, { lazy, Suspense, useEffect, useState } from 'react'

import type { RichTextPlugin, SlateFieldProps } from '../types.js'
import type { EnabledFeatures } from './types.js'

import { SlatePropsProvider } from '../utilities/SlatePropsProvider.js'
import { createFeatureMap } from './createFeatureMap.js'

const RichTextEditor = lazy(() =>
  import('./RichText.js').then((module) => ({
    default: module.RichText,
  })),
)

export const RichTextField: React.FC<SlateFieldProps> = (props) => {
  const { componentMap, schemaPath } = props

  const clientFunctions = useClientFunctions()
  const [hasLoadedPlugins, setHasLoadedPlugins] = useState(false)

  const [features] = useState<EnabledFeatures>(() => {
    return createFeatureMap(new Map(Object.entries(componentMap)))
  })

  const [plugins, setPlugins] = useState<RichTextPlugin[]>([])

  useEffect(() => {
    if (!hasLoadedPlugins) {
      const plugins: RichTextPlugin[] = []

      Object.entries(clientFunctions).forEach(([key, plugin]) => {
        if (key.startsWith(`slatePlugin.${schemaPath}.`)) {
          plugins.push(plugin)
        }
      })

      if (plugins.length === features.plugins.length) {
        setPlugins(plugins)
        setHasLoadedPlugins(true)
      }
    }
  }, [hasLoadedPlugins, clientFunctions, schemaPath, features.plugins.length])

  if (!hasLoadedPlugins) {
    return (
      <SlatePropsProvider schemaPath={schemaPath}>
        {Array.isArray(features.plugins) &&
          features.plugins.map((Plugin, i) => {
            return <React.Fragment key={i}>{Plugin}</React.Fragment>
          })}
      </SlatePropsProvider>
    )
  }

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      <SlatePropsProvider schemaPath={schemaPath}>
        <RichTextEditor
          {...props}
          elements={features.elements}
          leaves={features.leaves}
          plugins={plugins}
        />
      </SlatePropsProvider>
    </Suspense>
  )
}
