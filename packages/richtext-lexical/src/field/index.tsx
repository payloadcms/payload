'use client'

import { ShimmerEffect, useClientFunctions, useFieldProps } from '@payloadcms/ui'
import React, { Suspense, lazy, useEffect, useState } from 'react'

import type { FeatureProviderClient } from '../features/typesClient.js'
import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'
import type { GeneratedFeatureProviderComponent, LexicalRichTextFieldProps } from '../types.js'

import { defaultEditorLexicalConfig } from '../lexical/config/client/default.js'
import { loadClientFeatures } from '../lexical/config/client/loader.js'
import { sanitizeClientEditorConfig } from '../lexical/config/client/sanitize.js'

const RichTextEditor = lazy(() =>
  import('./Field.js').then((module) => ({ default: module.RichText })),
)

export const RichTextField: React.FC<LexicalRichTextFieldProps> = (props) => {
  const {
    admin,
    field: { richTextComponentMap },
    lexicalEditorConfig,
  } = props
  const { schemaPath } = useFieldProps()
  const clientFunctions = useClientFunctions()
  const [hasLoadedFeatures, setHasLoadedFeatures] = useState(false)

  const [featureProviders, setFeatureProviders] = useState<
    FeatureProviderClient<unknown, unknown>[]
  >([])

  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<SanitizedClientEditorConfig>(null)

  let featureProviderComponents: GeneratedFeatureProviderComponent[] = richTextComponentMap.get(
    'features',
  ) as GeneratedFeatureProviderComponent[]
  // order by order
  featureProviderComponents = featureProviderComponents.sort((a, b) => a.order - b.order)

  let featureProvidersAndComponentsToLoad = 0 // feature providers and components
  for (const featureProvider of featureProviderComponents) {
    const featureComponentKeys = Array.from(richTextComponentMap.keys()).filter((key) =>
      key.startsWith(
        `lexical_internal_feature.${featureProvider.key}.lexical_internal_components.`,
      ),
    )

    featureProvidersAndComponentsToLoad += 1
    featureProvidersAndComponentsToLoad += featureComponentKeys.length
  }

  useEffect(() => {
    if (!hasLoadedFeatures) {
      const featureProvidersLocal: FeatureProviderClient<unknown, unknown>[] = []
      let featureProvidersAndComponentsLoaded = 0

      Object.entries(clientFunctions).forEach(([key, plugin]) => {
        if (key.startsWith(`lexicalFeature.${schemaPath}.`)) {
          if (!key.includes('.lexical_internal_components.')) {
            featureProvidersLocal.push(plugin)
          }

          featureProvidersAndComponentsLoaded++
        }
      })

      if (featureProvidersAndComponentsLoaded === featureProvidersAndComponentsToLoad) {
        setFeatureProviders(featureProvidersLocal)
        setHasLoadedFeatures(true)

        /**
         * Loaded feature provided => create the final sanitized editor config
         */

        const resolvedClientFeatures = loadClientFeatures({
          clientFunctions,
          schemaPath,
          unSanitizedEditorConfig: {
            features: featureProvidersLocal,
            lexical: lexicalEditorConfig,
          },
        })

        setFinalSanitizedEditorConfig(
          sanitizeClientEditorConfig(
            lexicalEditorConfig ? lexicalEditorConfig : defaultEditorLexicalConfig,
            resolvedClientFeatures,
            admin,
          ),
        )
      }
    }
  }, [
    admin,
    hasLoadedFeatures,
    clientFunctions,
    schemaPath,
    featureProviderComponents.length,
    featureProviders,
    finalSanitizedEditorConfig,
    lexicalEditorConfig,
    featureProvidersAndComponentsToLoad,
  ])

  if (!hasLoadedFeatures) {
    return (
      <React.Fragment>
        {Array.isArray(featureProviderComponents) &&
          featureProviderComponents.map((featureProvider) => {
            // get all components starting with key feature.${FeatureProvider.key}.components.{featureComponentKey}
            const featureComponentKeys = Array.from(richTextComponentMap.keys()).filter((key) =>
              key.startsWith(
                `lexical_internal_feature.${featureProvider.key}.lexical_internal_components.`,
              ),
            )
            const featureComponents: React.ReactNode[] = featureComponentKeys.map((key) => {
              return richTextComponentMap.get(key)
            }) as React.ReactNode[] // TODO: Type better

            return (
              <React.Fragment key={featureProvider.key}>
                {featureComponents?.length
                  ? featureComponents.map((FeatureComponent) => {
                      return FeatureComponent
                    })
                  : null}
                {featureProvider.ClientFeature}
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
