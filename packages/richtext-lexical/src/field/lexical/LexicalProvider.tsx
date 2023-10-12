import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import type { EditorState, SerializedEditorState } from 'lexical'
import type { LexicalEditor } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import * as React from 'react'

import type { FieldProps } from '../../types'
import type { SanitizedEditorConfig } from './config/types'

import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor'
import { EditorConfigProvider } from './config/EditorConfigProvider'
import { getEnabledNodes } from './nodes'
export type LexicalProviderProps = {
  editorConfig: SanitizedEditorConfig
  fieldProps: FieldProps
  initialState: SerializedEditorState
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  readOnly: boolean
  setValue: (value: SerializedEditorState) => void
  value: SerializedEditorState
}
export const LexicalProvider: React.FC<LexicalProviderProps> = (props) => {
  const { editorConfig, fieldProps, initialState, onChange, readOnly, setValue, value } = props

  if (
    (value && Array.isArray(value) && !('root' in value)) ||
    (initialState && Array.isArray(initialState) && !('root' in initialState))
  ) {
    throw new Error(
      'You have tried to pass in data from the old, Slate editor, to the new, Lexical editor. This is not supported. There is no automatic conversion from Slate to Lexical data available yet (coming soon). Please remove the data from the field and start again.',
    )
  }

  if (value && 'jsonContent' in value) {
    throw new Error(
      'You have tried to pass in data from payload-plugin-lexical. This is not supported. The data structure has changed in this editor, compared to the plugin, and there is no automatic conversion available yet (coming soon). Please remove the data from the field and start again.',
    )
  }

  const initialConfig: InitialConfigType = {
    editable: readOnly === true ? false : true,
    editorState: initialState != null ? JSON.stringify(initialState) : undefined,
    namespace: editorConfig.lexical.namespace,
    nodes: [...getEnabledNodes({ editorConfig })],
    onError: (error: Error) => {
      throw error
    },
    theme: editorConfig.lexical.theme,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorConfigProvider editorConfig={editorConfig} fieldProps={fieldProps}>
        <div className="editor-shell">
          <LexicalEditorComponent
            editorConfig={editorConfig}
            fieldProps={fieldProps}
            initialState={initialState}
            onChange={onChange}
            readOnly={readOnly}
            setValue={setValue}
            value={value}
          />
        </div>
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
