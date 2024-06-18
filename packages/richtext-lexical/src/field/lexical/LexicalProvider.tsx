'use client'
import type { InitialConfigType } from '@lexical/react/LexicalComposer.js'
import type { FormFieldBase } from '@payloadcms/ui/fields/shared'
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer.js'
import * as React from 'react'
import { useMemo } from 'react'

import type { SanitizedClientEditorConfig } from './config/types.js'

import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor.js'
import {
  EditorConfigProvider,
  useEditorConfigContext,
} from './config/client/EditorConfigProvider.js'
import { getEnabledNodes } from './nodes/index.js'

export type LexicalProviderProps = {
  editorConfig: SanitizedClientEditorConfig
  fieldProps: FormFieldBase & {
    editorConfig: SanitizedClientEditorConfig // With rendered features n stuff
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  path: string
  readOnly: boolean
  value: SerializedEditorState
}
export const LexicalProvider: React.FC<LexicalProviderProps> = (props) => {
  const { editorConfig, fieldProps, onChange, path, readOnly, value } = props

  const parentContext = useEditorConfigContext()

  const editorContainerRef = React.useRef<HTMLDivElement>(null)

  const processedValue = useMemo(() => {
    let processed = value
    if (editorConfig?.features?.hooks?.load?.length) {
      editorConfig.features.hooks.load.forEach((hook) => {
        processed = hook({ incomingEditorState: processed })
      })
    }
    return processed
  }, [editorConfig, value])

  // useMemo for the initialConfig that depends on readOnly and processedValue
  const initialConfig = useMemo<InitialConfigType>(() => {
    if (processedValue && typeof processedValue !== 'object') {
      throw new Error(
        'The value passed to the Lexical editor is not an object. This is not supported. Please remove the data from the field and start again. This is the value that was passed in: ' +
          JSON.stringify(processedValue),
      )
    }

    if (processedValue && Array.isArray(processedValue) && !('root' in processedValue)) {
      throw new Error(
        'You have tried to pass in data from the old, Slate editor, to the new, Lexical editor. This is not supported. There is no automatic conversion from Slate to Lexical data available yet (coming soon). Please remove the data from the field and start again.',
      )
    }

    if (processedValue && 'jsonContent' in processedValue) {
      throw new Error(
        'You have tried to pass in data from payload-plugin-lexical. This is not supported. The data structure has changed in this editor, compared to the plugin, and there is no automatic conversion available yet (coming soon). Please remove the data from the field and start again.',
      )
    }

    return {
      editable: readOnly !== true,
      editorState: processedValue != null ? JSON.stringify(processedValue) : undefined,
      namespace: editorConfig.lexical.namespace,
      nodes: [...getEnabledNodes({ editorConfig })],
      onError: (error: Error) => {
        throw error
      },
      theme: editorConfig.lexical.theme,
    }
  }, [editorConfig, processedValue, readOnly])

  if (!initialConfig) {
    return <p>Loading...</p>
  }

  return (
    <LexicalComposer initialConfig={initialConfig} key={path}>
      <EditorConfigProvider
        editorConfig={editorConfig}
        editorContainerRef={editorContainerRef}
        fieldProps={fieldProps}
        parentContext={parentContext}
      >
        <LexicalEditorComponent
          editorConfig={editorConfig}
          editorContainerRef={editorContainerRef}
          onChange={onChange}
        />
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
