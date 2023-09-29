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
