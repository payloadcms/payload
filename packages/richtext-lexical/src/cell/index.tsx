'use client'
import type { EditorConfig as LexicalEditorConfig } from 'lexical'
import type { CellComponentProps, RichTextFieldClient } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { useTableCell } from '@payloadcms/ui'
import { $getRoot } from 'lexical'
import React, { useEffect, useMemo } from 'react'

import type { FeatureProviderClient } from '../features/typesClient.js'
import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'
import type { GeneratedFeatureProviderComponent, LexicalFieldAdminProps } from '../types.js'

import { defaultEditorLexicalConfig } from '../lexical/config/client/default.js'
import { loadClientFeatures } from '../lexical/config/client/loader.js'
import { sanitizeClientEditorConfig } from '../lexical/config/client/sanitize.js'
import { getEnabledNodes } from '../lexical/nodes/index.js'

export const RichTextCell: React.FC<
  {
    readonly admin?: LexicalFieldAdminProps
    readonly lexicalEditorConfig: LexicalEditorConfig
  } & CellComponentProps<RichTextFieldClient>
> = (props) => {
  const {
    admin,
    field: { richTextComponentMap },
    lexicalEditorConfig,
  } = props

  const [preview, setPreview] = React.useState('Loading...')

  const { cellData } = useTableCell()

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

  useEffect(() => {
    let dataToUse = cellData
    if (dataToUse == null || !finalSanitizedEditorConfig) {
      setPreview('')
      return
    }

    // Transform data through load hooks
    if (finalSanitizedEditorConfig?.features?.hooks?.load?.length) {
      finalSanitizedEditorConfig.features.hooks.load.forEach((hook) => {
        dataToUse = hook({ incomingEditorState: dataToUse })
      })
    }

    if (!dataToUse || typeof dataToUse !== 'object') {
      setPreview('')
      return
    }

    // If data is from Slate and not Lexical
    if (Array.isArray(dataToUse) && !('root' in dataToUse)) {
      setPreview('')
      return
    }

    // If data is from payload-plugin-lexical
    if ('jsonContent' in dataToUse) {
      setPreview('')
      return
    }

    // initialize headless editor
    const headlessEditor = createHeadlessEditor({
      namespace: finalSanitizedEditorConfig.lexical.namespace,
      nodes: getEnabledNodes({ editorConfig: finalSanitizedEditorConfig }),
      theme: finalSanitizedEditorConfig.lexical.theme,
    })
    headlessEditor.setEditorState(headlessEditor.parseEditorState(dataToUse))

    const textContent =
      headlessEditor.getEditorState().read(() => {
        return $getRoot().getTextContent()
      }) || ''

    // Limiting the number of characters shown is done in a CSS rule
    setPreview(textContent)
  }, [cellData, finalSanitizedEditorConfig])

  return <span>{preview}</span>
}
