'use client'

import type { RichTextFieldClient } from 'payload'

import { ShimmerEffect, useConfig } from '@payloadcms/ui'
import React, { lazy, Suspense, useEffect, useState } from 'react'

import type { FeatureProviderClient } from '../features/typesClient.js'
import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'
import type { LexicalRichTextFieldProps } from '../types.js'

import { defaultEditorLexicalConfig } from '../lexical/config/client/default.js'
import { loadClientFeatures } from '../lexical/config/client/loader.js'
import { sanitizeClientEditorConfig } from '../lexical/config/client/sanitize.js'

const RichTextEditor = lazy(() =>
  import('./Field.js').then((module) => ({ default: module.RichText })),
)

export const RichTextField: React.FC<LexicalRichTextFieldProps> = (props) => {
  const {
    admin = {},
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap,
    field,
    lexicalEditorConfig = defaultEditorLexicalConfig,
    schemaPath,
  } = props

  const { config } = useConfig()

  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<null | SanitizedClientEditorConfig>(null)

  useEffect(() => {
    if (finalSanitizedEditorConfig) {
      return
    }

    const featureProvidersLocal: FeatureProviderClient<any, any>[] = []
    for (const [_featureKey, clientFeature] of Object.entries(clientFeatures)) {
      if (!clientFeature.clientFeatureProvider) {
        continue
      }
      featureProvidersLocal.push(
        clientFeature.clientFeatureProvider(clientFeature.clientFeatureProps),
      ) // Execute the clientFeatureProvider function here, as the server cannot execute functions imported from use client files
    }

    const finalLexicalEditorConfig = lexicalEditorConfig
      ? lexicalEditorConfig
      : defaultEditorLexicalConfig

    const resolvedClientFeatures = loadClientFeatures({
      config,
      featureClientImportMap,
      featureClientSchemaMap,
      field: field as RichTextFieldClient,
      schemaPath: schemaPath ?? field.name,
      unSanitizedEditorConfig: {
        features: featureProvidersLocal,
        lexical: finalLexicalEditorConfig,
      },
    })

    setFinalSanitizedEditorConfig(
      sanitizeClientEditorConfig(resolvedClientFeatures, finalLexicalEditorConfig, admin),
    )
  }, [
    lexicalEditorConfig,
    admin,
    finalSanitizedEditorConfig,
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap,
    field,
    config,
    schemaPath,
  ]) // TODO: Optimize this and use useMemo for this in the future. This might break sub-richtext-blocks from the blocks feature. Need to investigate

  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      {finalSanitizedEditorConfig && (
        <RichTextEditor {...props} editorConfig={finalSanitizedEditorConfig} />
      )}
    </Suspense>
  )
}
