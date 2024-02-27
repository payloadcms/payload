'use client'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import { type FormFieldBase, ShimmerEffect } from '@payloadcms/ui'
import React, { Suspense, lazy, useEffect, useState } from 'react'

import type { SanitizedEditorConfig } from './lexical/config/types'

import { useFieldPath } from '../../../ui/src/forms/FieldPathProvider'
import { useClientFunctions } from '../../../ui/src/providers/ClientFunction'
import { defaultEditorLexicalConfig } from './lexical/config/defaultClient'
import { sanitizeEditorConfig } from './lexical/config/sanitize'

// @ts-expect-error-next-line Just TypeScript being broken // TODO: Open TypeScript issue
const RichTextEditor = lazy(() => import('./Field'))

export const RichTextField: React.FC<
  FormFieldBase & {
    lexicalEditorConfig: LexicalEditorConfig
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
> = (props) => {
  const { lexicalEditorConfig, richTextComponentMap } = props
  const { schemaPath } = useFieldPath()
  const clientFunctions = useClientFunctions()

  const finalSanitizedEditorConfig: SanitizedEditorConfig = sanitizeEditorConfig({
    features: [],
    lexical: lexicalEditorConfig
      ? () => Promise.resolve(lexicalEditorConfig)
      : () => Promise.resolve(defaultEditorLexicalConfig),
  })

  const [hasLoadedFeatures, setHasLoadedFeatures] = useState(false)

  const [featureComponents, setFeatureComponents] = useState<React.ReactNode>([])

  const featureProviders = Array.from(richTextComponentMap.values())

  useEffect(() => {
    if (!hasLoadedFeatures) {
      const featureComponentsLocal: React.ReactNode[] = []

      Object.entries(clientFunctions).forEach(([key, plugin]) => {
        if (key.startsWith(`lexicalFeature.${schemaPath}.`)) {
          featureComponentsLocal.push(plugin)
        }
      })

      if (featureComponentsLocal.length === featureProviders.length) {
        setFeatureComponents(featureComponentsLocal)
        setHasLoadedFeatures(true)
      }
    }
  }, [hasLoadedFeatures, clientFunctions, schemaPath, featureProviders.length])

  if (!hasLoadedFeatures) {
    return (
      <React.Fragment>
        {Array.isArray(featureProviders) &&
          featureProviders.map((FeatureProvider, i) => {
            return <React.Fragment key={i}>{FeatureProvider}</React.Fragment>
          })}
      </React.Fragment>
    )
  }

  const features = clientFunctions

  console.log('clientFunctions', features['lexicalFeature.posts.richText.paragraph'])

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      <RichTextEditor {...props} editorConfig={finalSanitizedEditorConfig} />
    </Suspense>
  )
}
