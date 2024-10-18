'use client'
import type { InitialConfigType } from '@lexical/react/LexicalComposer.js'
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer.js'
import * as React from 'react'
import { useMemo } from 'react'

import type { LexicalRichTextFieldProps } from '../types.js'
import type { SanitizedClientEditorConfig } from './config/types.js'

import {
  EditorConfigProvider,
  useEditorConfigContext,
} from './config/client/EditorConfigProvider.js'
import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor.js'
import { getEnabledNodes } from './nodes/index.js'

export type LexicalProviderProps = {
  composerKey: string
  editorConfig: SanitizedClientEditorConfig
  field: LexicalRichTextFieldProps['field']
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  readOnly: boolean
  value: SerializedEditorState
}

const NestProviders = ({ children, providers }) => {
  if (!providers?.length) {
    return children
  }
  const Component = providers[0]
  if (providers.length > 1) {
    return (
      <Component>
        <NestProviders providers={providers.slice(1)}>{children}</NestProviders>
      </Component>
    )
  }
  return <Component>{children}</Component>
}

export const LexicalProvider: React.FC<LexicalProviderProps> = (props) => {
  const { composerKey, editorConfig, field, onChange, readOnly, value } = props

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
        'You have tried to pass in data from the old Slate editor to the new Lexical editor. The data structure is different, thus you will have to migrate your data. We offer a one-line migration script which migrates all your rich text fields: https://payloadcms.com/docs/beta/lexical/migration#migration-via-migration-script-recommended',
      )
    }

    if (processedValue && 'jsonContent' in processedValue) {
      throw new Error(
        'You have tried to pass in data from payload-plugin-lexical. The data structure is different, thus you will have to migrate your data. Migration guide: https://payloadcms.com/docs/beta/lexical/migration#migrating-from-payload-plugin-lexical',
      )
    }

    return {
      editable: readOnly !== true,
      editorState: processedValue != null ? JSON.stringify(processedValue) : undefined,
      namespace: editorConfig.lexical.namespace,
      nodes: getEnabledNodes({ editorConfig }),
      onError: (error: Error) => {
        throw error
      },
      theme: editorConfig.lexical.theme,
    }
  }, [editorConfig, processedValue, readOnly])

  if (!initialConfig) {
    return <p>Loading...</p>
  }

  // We need to add initialConfig.editable to the key to force a re-render when the readOnly prop changes.
  // Without it, there were cases where lexical editors inside drawers turn readOnly initially - a few miliseconds later they turn editable, but the editor does not re-render and stays readOnly.
  return (
    <LexicalComposer initialConfig={initialConfig} key={composerKey + initialConfig.editable}>
      <EditorConfigProvider
        editorConfig={editorConfig}
        editorContainerRef={editorContainerRef}
        field={field}
        parentContext={parentContext}
      >
        <NestProviders providers={editorConfig.features.providers}>
          <LexicalEditorComponent
            editorConfig={editorConfig}
            editorContainerRef={editorContainerRef}
            onChange={onChange}
          />
        </NestProviders>
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
