import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import type { EditorState, SerializedEditorState } from 'lexical'
import type { LexicalEditor } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import * as React from 'react'

import type { SanitizedEditorConfig } from './config/types'

import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor'
import { EditorConfigProvider } from './config/EditorConfigProvider'
import { getEnabledNodes } from './nodes'
export type LexicalProviderProps = {
  editorConfig: SanitizedEditorConfig
  initialState: SerializedEditorState
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  readOnly: boolean
  setValue: (value: SerializedEditorState) => void
  value: SerializedEditorState
}
export const LexicalProvider: React.FC<LexicalProviderProps> = (props) => {
  const { editorConfig, initialState, onChange, readOnly, setValue, value } = props

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
      <EditorConfigProvider editorConfig={editorConfig}>
        <div className="editor-shell">
          <LexicalEditorComponent
            editorConfig={editorConfig}
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
