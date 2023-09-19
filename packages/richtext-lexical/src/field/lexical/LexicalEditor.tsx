import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import * as React from 'react'

import type { LexicalProviderProps } from './LexicalProvider'

import './LexicalEditor.scss'
import { FloatingSelectToolbarPlugin } from './plugins/FloatingSelectToolbar'
import ContentEditable from './ui/ContentEditable'

export const LexicalEditor: React.FC<LexicalProviderProps> = (props) => {
  const { onChange } = props

  return (
    <React.Fragment>
      <RichTextPlugin
        ErrorBoundary={LexicalErrorBoundary}
        contentEditable={
          <div className="editor-scroller">
            <div className="editor">
              <ContentEditable />
            </div>
          </div>
        }
        placeholder={<p>testplaceholder</p>}
      />
      <OnChangePlugin
        // Selection changes can be ignore here, reducing the
        // frequency that the FieldComponent and Payload receive updates.
        // Selection changes are only needed if you are saving selection state
        ignoreSelectionChange
        onChange={(editorState, editor, tags) => {
          // Ignore any onChange event triggered by focus only
          if (!tags.has('focus') || tags.size > 1) {
            if (onChange != null) onChange(editorState, editor, tags)
          }
        }}
      />
      <FloatingSelectToolbarPlugin />
    </React.Fragment>
  )
}
