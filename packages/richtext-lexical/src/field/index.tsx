'use client'

import type { EditorConfig as LexicalEditorConfig } from 'lexical'
import type { RichTextFieldClient } from 'payload'

import { ShimmerEffect, useConfig } from '@payloadcms/ui'
import React, { lazy, Suspense, useEffect, useState } from 'react'

import type { FeatureProviderClient } from '../features/typesClient.js'
import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'
import type { LexicalFieldAdminClientProps, LexicalRichTextFieldProps } from '../types.js'

import { defaultEditorLexicalConfig } from '../lexical/config/client/default.js'
import { loadClientFeatures } from '../lexical/config/client/loader.js'
import { sanitizeClientEditorConfig } from '../lexical/config/client/sanitize.js'
import { RichTextViewProvider } from './RichTextViewProvider.js'

const RichTextEditor = lazy(() =>
  import('./Field.js').then((module) => ({ default: module.RichText })),
)

export const RichTextField: React.FC<LexicalRichTextFieldProps> = (props) => {
  const {
    admin: _admin = {},
    clientFeatures,
    featureClientImportMap = {},
    featureClientSchemaMap,
    field,
    lexicalEditorConfig: _lexicalEditorConfig = defaultEditorLexicalConfig,
    schemaPath,
    views,
  } = props
  const [currentView, setCurrentView] = useState<string>('default')
  const currentViewAdminConfig: LexicalFieldAdminClientProps = views?.[currentView]?.admin ?? _admin
  const currentViewLexicalEditorConfig: LexicalEditorConfig =
    views?.[currentView]?.lexical ?? _lexicalEditorConfig

  const { config } = useConfig()

  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<null | SanitizedClientEditorConfig>(null)

  useEffect(() => {
    if (finalSanitizedEditorConfig && finalSanitizedEditorConfig.view === currentView) {
      return
    }

    const featureProvidersLocal: FeatureProviderClient<any, any>[] = []
    for (const clientFeature of Object.values(clientFeatures)) {
      if (!clientFeature.clientFeatureProvider) {
        continue
      }
      featureProvidersLocal.push(
        clientFeature.clientFeatureProvider(clientFeature.clientFeatureProps),
      ) // Execute the clientFeatureProvider function here, as the server cannot execute functions imported from use client files
    }

    const resolvedClientFeatures = loadClientFeatures({
      config,
      featureClientImportMap,
      featureClientSchemaMap,
      field: field as RichTextFieldClient,
      schemaPath: schemaPath ?? field.name,
      unSanitizedEditorConfig: {
        features: featureProvidersLocal,
        lexical: currentViewLexicalEditorConfig,
      },
    })

    setFinalSanitizedEditorConfig(
      sanitizeClientEditorConfig(
        resolvedClientFeatures,
        currentViewLexicalEditorConfig,
        currentViewAdminConfig,
        currentView,
      ),
    )
  }, [
    currentViewAdminConfig,
    clientFeatures,
    config,
    featureClientImportMap,
    featureClientSchemaMap,
    field,
    finalSanitizedEditorConfig,
    currentViewLexicalEditorConfig,
    schemaPath,
    currentView,
  ]) // TODO: Optimize this and use useMemo for this in the future. This might break sub-richtext-blocks from the blocks feature. Need to investigate

  return (
    <RichTextViewProvider
      currentView={currentView}
      setCurrentView={setCurrentView}
      views={props.views}
    >
      <Suspense fallback={<ShimmerEffect height="35vh" />}>
        {finalSanitizedEditorConfig && (
          <RichTextEditor
            {...props}
            editorConfig={finalSanitizedEditorConfig}
            key={finalSanitizedEditorConfig.view}
          />
        )}
      </Suspense>
    </RichTextViewProvider>
  )
}
