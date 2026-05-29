'use client'
import type { InitialConfigType } from '@lexical/react/LexicalComposer.js'
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer.js'
import { useEditDepth } from '@payloadcms/ui'
import * as React from 'react'
import { useMemo } from 'react'

import type { LexicalRichTextFieldProps } from '../types/index.js'
import type { SanitizedClientEditorConfig } from './config/types.js'

import { useRichTextView } from '../field/RichTextViewProvider.js'
import {
  EditorConfigProvider,
  useEditorConfigContext,
} from './config/client/EditorConfigProvider.js'
import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor.js'
import { getEnabledNodes } from './nodes/index.js'

export type LexicalProviderProps = {
  composerKey: string
  editorConfig: SanitizedClientEditorConfig
  fieldProps: LexicalRichTextFieldProps
  isSmallWidthViewport: boolean
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  readOnly: boolean
  rtl?: boolean
  value: SerializedEditorState
}

const NestProviders = ({
  children,
  providers,
}: {
  children: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: any[]
}) => {
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
  const {
    composerKey,
    editorConfig,
    fieldProps,
    isSmallWidthViewport,
    onChange,
    readOnly,
    rtl,
    value,
  } = props

  const { currentView, views } = useRichTextView()

  const parentContext = useEditorConfigContext()

  const editDepth = useEditDepth()

  const editorContainerRef = React.useRef<HTMLDivElement>(null)

  // useMemo for the initialConfig. `readOnly` and `value` are intentionally excluded from deps
  // to avoid full remounts on every save (which would destroy cursor position and undo history).
  const initialConfig = useMemo<InitialConfigType>(() => {
    if (value && typeof value !== 'object') {
      throw new Error(
        'The value passed to the Lexical editor is not an object. This is not supported. Please remove the data from the field and start again. This is the value that was passed in: ' +
          JSON.stringify(value),
      )
    }

    if (value && Array.isArray(value) && !('root' in value)) {
      throw new Error(
        'You have tried to pass in data from the old Slate editor to the new Lexical editor. The data structure is different, thus you will have to migrate your data. We offer a one-line migration script which migrates all your rich text fields: https://payloadcms.com/docs/lexical/migration#migration-via-migration-script-recommended',
      )
    }

    if (value && 'jsonContent' in value) {
      throw new Error(
        'You have tried to pass in data from payload-plugin-lexical. The data structure is different, thus you will have to migrate your data. Migration guide: https://payloadcms.com/docs/lexical/migration#migrating-from-payload-plugin-lexical',
      )
    }

    // Use the 'default' view if available, otherwise undefined
    const nodeViews = views?.[currentView]?.nodes

    return {
      editable: readOnly !== true,
      editorState: value != null ? JSON.stringify(value) : undefined,
      namespace: editorConfig.lexical.namespace,
      nodes: getEnabledNodes({
        editorConfig,
        nodeViews,
      }),
      onError: (error: Error) => {
        throw error
      },
      theme: editorConfig.lexical.theme,
    }
    // Important: do not add readOnly and value to the dependencies array. This will cause the entire lexical editor to re-render if the document is saved, which will
    // cause the editor to lose focus.
  }, [editorConfig, views, currentView])

  // Track whether the editor has ever been editable. Once it transitions to editable,
  // we never remount due to transient readOnly changes (e.g. during form save processing).
  const hasBeenEditable = React.useRef(readOnly !== true)
  if (readOnly !== true) {
    hasBeenEditable.current = true
  }

  // Compute the effective editable state for the config.
  // Override the memoized config's editable value to reflect the current readOnly prop.
  const effectiveConfig = useMemo<InitialConfigType>(
    () => ({
      ...initialConfig,
      editable: readOnly !== true,
    }),

    [initialConfig, readOnly],
  )

  if (!effectiveConfig) {
    return <p>Loading...</p>
  }

  // Use `hasBeenEditable` to build the key: only force a remount when the editor has NEVER
  // been editable and transitions to editable for the first time. After that, LexicalComposer
  // stays mounted (preserving cursor/focus/undo) and we rely on Lexical's internal
  // `editor.setEditable()` for transient readOnly changes during saves.
  const editableKey = hasBeenEditable.current ? 'editable' : 'readonly'
  return (
    <LexicalComposer initialConfig={effectiveConfig} key={composerKey + editableKey + currentView}>
      <EditorConfigProvider
        editorConfig={editorConfig}
        editorContainerRef={editorContainerRef}
        fieldProps={fieldProps}
        /**
         * Parent editor is not truly the parent editor, if the current editor is part of a drawer and the parent editor is the main editor.
         */
        parentContext={parentContext?.editDepth === editDepth ? parentContext : undefined}
      >
        <NestProviders providers={editorConfig.features.providers}>
          <LexicalEditorComponent
            editorConfig={editorConfig}
            editorContainerRef={editorContainerRef}
            isSmallWidthViewport={isSmallWidthViewport}
            onChange={onChange}
            rtl={rtl}
          />
        </NestProviders>
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
