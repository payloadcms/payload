'use client'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import { type FormFieldBase, ShimmerEffect } from '@payloadcms/ui'
import React, { Suspense, lazy, useEffect, useState } from 'react'

import type { GeneratedFeatureProviderComponent } from '../types'
import type { FeatureProviderClient } from './features/types'
import type { SanitizedClientEditorConfig } from './lexical/config/types'

import { useFieldPath } from '../../../ui/src/forms/FieldPathProvider'
import { useClientFunctions } from '../../../ui/src/providers/ClientFunction'
import { defaultEditorLexicalConfig } from './lexical/config/client/default'
import { loadClientFeatures } from './lexical/config/client/loader'
import { sanitizeClientEditorConfig } from './lexical/config/client/sanitize'

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
  const [hasLoadedFeatures, setHasLoadedFeatures] = useState(false)

  const [featureProviders, setFeatureProviders] = useState<FeatureProviderClient<unknown>[]>([])

  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<SanitizedClientEditorConfig>(null)

  let featureProviderComponents: GeneratedFeatureProviderComponent[] =
    richTextComponentMap.get('features')
  // order by order
  featureProviderComponents = featureProviderComponents.sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (!hasLoadedFeatures) {
      const featureProvidersLocal: FeatureProviderClient<unknown>[] = []

      Object.entries(clientFunctions).forEach(([key, plugin]) => {
        if (key.startsWith(`lexicalFeature.${schemaPath}.`)) {
          featureProvidersLocal.push(plugin)
        }
      })

      if (featureProvidersLocal.length === featureProviderComponents.length) {
        setFeatureProviders(featureProvidersLocal)
        setHasLoadedFeatures(true)

        /**
         * Loaded feature provided => create the final sanitized editor config
         */

        const resolvedClientFeatures = loadClientFeatures({
          unSanitizedEditorConfig: {
            features: featureProvidersLocal,
            lexical: lexicalEditorConfig,
          },
        })

        setFinalSanitizedEditorConfig(
          sanitizeClientEditorConfig(
            lexicalEditorConfig ? lexicalEditorConfig : defaultEditorLexicalConfig,
            resolvedClientFeatures,
          ),
        )
      }
    }
  }, [
    hasLoadedFeatures,
    clientFunctions,
    schemaPath,
    featureProviderComponents.length,
    featureProviders,
    finalSanitizedEditorConfig,
    lexicalEditorConfig,
  ])

  if (!hasLoadedFeatures) {
    return (
      <React.Fragment>
        {Array.isArray(featureProviderComponents) &&
          featureProviderComponents.map((FeatureProvider) => {
            return (
              <React.Fragment key={FeatureProvider.key}>
                {FeatureProvider.ClientComponent}
              </React.Fragment>
            )
          })}
      </React.Fragment>
    )
  }

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      {finalSanitizedEditorConfig && (
        <RichTextEditor {...props} editorConfig={finalSanitizedEditorConfig} />
      )}
    </Suspense>
  )
}
