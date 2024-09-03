'use client'

import { ShimmerEffect } from '@payloadcms/ui'
import React, { lazy, Suspense, useMemo } from 'react'

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
    admin = {},
    field: { richTextComponentMap },
    lexicalEditorConfig,
  } = props

  const finalSanitizedEditorConfig = useMemo<SanitizedClientEditorConfig>(() => {
    const clientFeatures: GeneratedFeatureProviderComponent[] = richTextComponentMap.get(
      'features',
    ) as GeneratedFeatureProviderComponent[]

    const featureProvidersLocal: FeatureProviderClient<any, any>[] = []
    for (const clientFeature of clientFeatures) {
      featureProvidersLocal.push(clientFeature.clientFeature(clientFeature.clientFeatureProps))
    }

    const finalLexicalEditorConfig = lexicalEditorConfig
      ? lexicalEditorConfig
      : defaultEditorLexicalConfig

    const resolvedClientFeatures = loadClientFeatures({
      unSanitizedEditorConfig: {
        features: featureProvidersLocal,
        lexical: finalLexicalEditorConfig,
      },
    })

    return sanitizeClientEditorConfig(resolvedClientFeatures, finalLexicalEditorConfig)
  }, [richTextComponentMap, lexicalEditorConfig])

  finalSanitizedEditorConfig.admin = admin

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      {finalSanitizedEditorConfig && (
        <RichTextEditor {...props} editorConfig={finalSanitizedEditorConfig} />
      )}
    </Suspense>
  )
}
