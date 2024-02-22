'use client'
import type { FormFieldBase } from '@payloadcms/ui/types'

import { ShimmerEffect } from '@payloadcms/ui'
import React, { Suspense, lazy, useEffect, useState } from 'react'

import type { RichTextPlugin } from '../types'
import type { EnabledFeatures } from './types'

import { useFieldPath } from '../../../ui/src/forms/FieldPathProvider'
import { useClientFunctions } from '../../../ui/src/providers/ClientFunction'
import { createFeatureMap } from './createFeatureMap'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const RichTextEditor = lazy(() => import('./RichText'))

const RichTextField: React.FC<
  FormFieldBase & {
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
> = (props) => {
  const { richTextComponentMap } = props

  const { schemaPath } = useFieldPath()
  const clientFunctions = useClientFunctions()
  const [hasLoadedPlugins, setHasLoadedPlugins] = useState(false)

  const [features] = useState<EnabledFeatures>(() => {
    return createFeatureMap(richTextComponentMap)
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
      <React.Fragment>
        {Array.isArray(features.plugins) &&
          features.plugins.map((Plugin, i) => {
            return <React.Fragment key={i}>{Plugin}</React.Fragment>
          })}
      </React.Fragment>
    )
  }

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      <RichTextEditor
        {...props}
        elements={features.elements}
        leaves={features.leaves}
        plugins={plugins}
      />
    </Suspense>
  )
}

export default RichTextField
