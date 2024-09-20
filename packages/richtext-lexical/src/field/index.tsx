'use client'

import type { RichTextFieldClient } from 'payload'

import { ShimmerEffect } from '@payloadcms/ui'
import React, { lazy, Suspense, useEffect, useState } from 'react'

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
    field,
    lexicalEditorConfig,
  } = props

  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<null | SanitizedClientEditorConfig>(null)

  useEffect(() => {
    if (finalSanitizedEditorConfig) {
      return
    }
    const clientFeatures: GeneratedFeatureProviderComponent[] = richTextComponentMap?.get(
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
      field: field as RichTextFieldClient,
      unSanitizedEditorConfig: {
        features: featureProvidersLocal,
        lexical: finalLexicalEditorConfig,
      },
    })

    setFinalSanitizedEditorConfig(
      sanitizeClientEditorConfig(resolvedClientFeatures, finalLexicalEditorConfig, admin),
    )
  }, [lexicalEditorConfig, richTextComponentMap, admin, finalSanitizedEditorConfig, field]) // TODO: Optimize this and use useMemo for this in the future. This might break sub-richtext-blocks from the blocks feature. Need to investigate

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      {finalSanitizedEditorConfig && (
        <RichTextEditor {...props} editorConfig={finalSanitizedEditorConfig} />
      )}
    </Suspense>
  )
}
