'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary.js'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin.js'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js'
import {
  $createParagraphNode,
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
} from 'lexical'
import * as React from 'react'
import { useEffect, useState } from 'react'

import type { LexicalProviderProps } from './LexicalProvider.js'

import { useEditorConfigContext } from './config/client/EditorConfigProvider.js'
import { EditorPlugin } from './EditorPlugin.js'
import './LexicalEditor.scss'
import { DecoratorPlugin } from './plugins/DecoratorPlugin/index.js'
import { AddBlockHandlePlugin } from './plugins/handles/AddBlockHandlePlugin/index.js'
import { DraggableBlockPlugin } from './plugins/handles/DraggableBlockPlugin/index.js'
import { InsertParagraphAtEndPlugin } from './plugins/InsertParagraphAtEnd/index.js'
import { MarkdownShortcutPlugin } from './plugins/MarkdownShortcut/index.js'
import { SlashMenuPlugin } from './plugins/SlashMenu/index.js'
import { TextPlugin } from './plugins/TextPlugin/index.js'
import { LexicalContentEditable } from './ui/ContentEditable.js'

export const LexicalEditor: React.FC<
  {
    editorContainerRef: React.RefObject<HTMLDivElement | null>
    isSmallWidthViewport: boolean
  } & Pick<LexicalProviderProps, 'editorConfig' | 'onChange'>
> = (props) => {
  const { editorConfig, editorContainerRef, isSmallWidthViewport, onChange } = props
  const editorConfigContext = useEditorConfigContext()
  const [editor] = useLexicalComposerContext()

  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  useEffect(() => {
    if (!editorConfigContext?.uuid) {
      console.error('Lexical Editor must be used within an EditorConfigProvider')
      return
    }
    if (editorConfigContext?.parentEditor?.uuid) {
      editorConfigContext.parentEditor?.registerChild(editorConfigContext.uuid, editorConfigContext)
    }

    const handleFocus = () => {
      editorConfigContext.focusEditor(editorConfigContext)
    }

    const handleBlur = () => {
      editorConfigContext.blurEditor(editorConfigContext)
    }

    const unregisterFocus = editor.registerCommand<MouseEvent>(
      FOCUS_COMMAND,
      () => {
        handleFocus()
        return true
      },
      COMMAND_PRIORITY_LOW,
    )

    const unregisterBlur = editor.registerCommand<MouseEvent>(
      BLUR_COMMAND,
      () => {
        handleBlur()
        return true
      },
      COMMAND_PRIORITY_LOW,
    )

    return () => {
      unregisterFocus()
      unregisterBlur()
      editorConfigContext.parentEditor?.unregisterChild?.(editorConfigContext.uuid)
    }
  }, [editor, editorConfigContext])

  return (
    <React.Fragment>
      {editorConfig.features.plugins?.map((plugin) => {
        if (plugin.position === 'aboveContainer') {
          return <EditorPlugin clientProps={plugin.clientProps} key={plugin.key} plugin={plugin} />
        }
      })}
      <div className="editor-container" ref={editorContainerRef}>
        {editorConfig.features.plugins?.map((plugin) => {
          if (plugin.position === 'top') {
            return (
              <EditorPlugin clientProps={plugin.clientProps} key={plugin.key} plugin={plugin} />
            )
          }
        })}
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor" ref={onRef}>
                <LexicalContentEditable editorConfig={editorConfig} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <InsertParagraphAtEndPlugin />
        <DecoratorPlugin />
        <TextPlugin features={editorConfig.features} />
        <OnChangePlugin
          // Selection changes can be ignored here, reducing the
          // frequency that the FieldComponent and Payload receive updates.
          // Selection changes are only needed if you are saving selection state
          ignoreSelectionChange
          onChange={(editorState, editor, tags) => {
            // Ignore any onChange event triggered by focus only
            if (!tags.has('focus') || tags.size > 1) {
              if (onChange != null) {
                onChange(editorState, editor, tags)
              }
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
            {editorConfig.features.plugins?.map((plugin) => {
              if (
                plugin.position === 'floatingAnchorElem' &&
                !(plugin.desktopOnly === true && isSmallWidthViewport)
              ) {
                return (
                  <EditorPlugin
                    anchorElem={floatingAnchorElem}
                    clientProps={plugin.clientProps}
                    key={plugin.key}
                    plugin={plugin}
                  />
                )
              }
            })}
            {editor.isEditable() && (
              <React.Fragment>
                <SlashMenuPlugin anchorElem={floatingAnchorElem} />
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        {editor.isEditable() && (
          <React.Fragment>
            <HistoryPlugin />
            {editorConfig?.features?.markdownTransformers?.length > 0 && <MarkdownShortcutPlugin />}
          </React.Fragment>
        )}
        {editorConfig.features.plugins?.map((plugin) => {
          if (plugin.position === 'normal') {
            return (
              <EditorPlugin clientProps={plugin.clientProps} key={plugin.key} plugin={plugin} />
            )
          }
        })}
        {editorConfig.features.plugins?.map((plugin) => {
          if (plugin.position === 'bottom') {
            return (
              <EditorPlugin clientProps={plugin.clientProps} key={plugin.key} plugin={plugin} />
            )
          }
        })}
      </div>
      {editorConfig.features.plugins?.map((plugin) => {
        if (plugin.position === 'belowContainer') {
          return <EditorPlugin clientProps={plugin.clientProps} key={plugin.key} plugin={plugin} />
        }
      })}
    </React.Fragment>
  )
}
