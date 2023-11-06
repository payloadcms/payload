'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import * as React from 'react'
import { useEffect, useState } from 'react'

import type { LexicalProviderProps } from './LexicalProvider'

import './LexicalEditor.scss'
import { FloatingSelectToolbarPlugin } from './plugins/FloatingSelectToolbar'
import { MarkdownShortcutPlugin } from './plugins/MarkdownShortcut'
import { SlashMenuPlugin } from './plugins/SlashMenu'
import { AddBlockHandlePlugin } from './plugins/handles/AddBlockHandlePlugin'
import { DraggableBlockPlugin } from './plugins/handles/DraggableBlockPlugin'
import { LexicalContentEditable } from './ui/ContentEditable'

export const LexicalEditor: React.FC<Pick<LexicalProviderProps, 'editorConfig' | 'onChange'>> = (
  props,
) => {
  const { editorConfig, onChange } = props
  const [editor] = useLexicalComposerContext()

  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false)

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = window.matchMedia('(max-width: 1025px)').matches

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport)
      }
    }
    updateViewPortWidth()
    window.addEventListener('resize', updateViewPortWidth)

    return () => {
      window.removeEventListener('resize', updateViewPortWidth)
    }
  }, [isSmallWidthViewport])

  return (
    <React.Fragment>
      <RichTextPlugin
        ErrorBoundary={LexicalErrorBoundary}
        contentEditable={
          <div className="editor-scroller">
            <div className="editor" ref={onRef}>
              <LexicalContentEditable />
            </div>
          </div>
        }
        placeholder={<p className="editor-placeholder">Start typing...</p>}
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
      {floatingAnchorElem && (
        <React.Fragment>
          {!isSmallWidthViewport && editor.isEditable() && (
            <React.Fragment>
              <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
              <AddBlockHandlePlugin anchorElem={floatingAnchorElem} />
            </React.Fragment>
          )}
          {editorConfig.features.plugins.map((plugin) => {
            if (
              plugin.position === 'floatingAnchorElem' &&
              !(plugin.desktopOnly === true && isSmallWidthViewport)
            ) {
              return <plugin.Component anchorElem={floatingAnchorElem} key={plugin.key} />
            }
          })}
          {editor.isEditable() && (
            <React.Fragment>
              <FloatingSelectToolbarPlugin anchorElem={floatingAnchorElem} />
              <SlashMenuPlugin anchorElem={floatingAnchorElem} />
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {editor.isEditable() && (
        <React.Fragment>
          <HistoryPlugin />
          <MarkdownShortcutPlugin />
        </React.Fragment>
      )}

      <TabIndentationPlugin />
      {editorConfig.features.plugins.map((plugin) => {
        if (plugin.position === 'normal') {
          return <plugin.Component key={plugin.key} />
        }
      })}
      {editorConfig.features.plugins.map((plugin) => {
        if (plugin.position === 'bottom') {
          return <plugin.Component key={plugin.key} />
        }
      })}
    </React.Fragment>
  )
}
