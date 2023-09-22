import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { useEditorConfigContext } from '../../config/EditorConfigProvider'
import { getDOMRangeRect } from '../../utils/getDOMRangeRect'
import { getSelectedNode } from '../../utils/getSelectedNode'
import { setFloatingElemPosition } from '../../utils/setFloatingElemPosition'
import { ToolbarButton } from './ToolbarButton'
import './index.scss'

function FloatingSelectToolbar({
  activeStates,
  anchorElem,
  editor,
}: {
  activeStates: Map<string, boolean>
  anchorElem: HTMLElement
  editor: LexicalEditor
}): JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null)
  const caretRef = useRef<HTMLDivElement | null>(null)

  const { editorConfig } = useEditorConfigContext()

  function mouseMoveListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current && (e.buttons === 1 || e.buttons === 3)) {
      const isOpacityZero = popupCharStylesEditorRef.current.style.opacity === '0'
      const isPointerEventsNone = popupCharStylesEditorRef.current.style.pointerEvents === 'none'
      if (!isOpacityZero || !isPointerEventsNone) {
        // Check if the mouse is not over the popup
        const x = e.clientX
        const y = e.clientY
        const elementUnderMouse = document.elementFromPoint(x, y)
        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          if (!isOpacityZero) {
            popupCharStylesEditorRef.current.style.opacity = '0'
          }
          if (!isPointerEventsNone) {
            popupCharStylesEditorRef.current.style.pointerEvents = 'none'
          }
        }
      }
    }
  }
  function mouseUpListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.opacity !== '1') {
        popupCharStylesEditorRef.current.style.opacity = '1'
      }
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto'
      }
    }
  }

  useEffect(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener)
      document.addEventListener('mouseup', mouseUpListener)

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener)
        document.removeEventListener('mouseup', mouseUpListener)
      }
    }
  }, [popupCharStylesEditorRef])

  const updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection()

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current
    const nativeSelection = window.getSelection()

    if (popupCharStylesEditorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement)

      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem, 'center')

      if (caretRef.current) {
        setFloatingElemPosition(rangeRect, caretRef.current, popupCharStylesEditorElem, 'center')
      }
    }
  }, [editor, anchorElem])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = () => {
      editor.getEditorState().read(() => {
        updateTextFormatFloatingToolbar()
      })
    }

    window.addEventListener('resize', update)
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [editor, updateTextFormatFloatingToolbar, anchorElem])

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateTextFormatFloatingToolbar()
    })
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateTextFormatFloatingToolbar()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateTextFormatFloatingToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateTextFormatFloatingToolbar])

  return (
    <div className="floating-select-toolbar-popup" ref={popupCharStylesEditorRef}>
      <div className="caret" ref={caretRef} />
      {editor.isEditable() && (
        <React.Fragment>
          <div className="format">
            {editorConfig?.features &&
              editorConfig.features?.floatingSelectToolbar?.buttons?.format.map((formatButton) => {
                if (formatButton.Component) {
                  return (
                    <formatButton.Component
                      activeStates={activeStates}
                      anchorElem={anchorElem}
                      editor={editor}
                      key={formatButton.key}
                    />
                  )
                }
                return (
                  <ToolbarButton
                    classNames={
                      activeStates && activeStates.get(formatButton.key) ? ['active'] : []
                    }
                    key={formatButton.key}
                    onClick={() => formatButton.onClick(editor)}
                  >
                    <formatButton.ChildComponent />
                  </ToolbarButton>
                )
              })}
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
): JSX.Element | null {
  const [isText, setIsText] = useState(false)
  const [activeStates, setActiveStates] = useState<Map<string, boolean>>(new Map())

  const { editorConfig } = useEditorConfigContext()

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return
      }
      const selection = $getSelection()
      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false)
        return
      }

      if (!$isRangeSelection(selection)) {
        return
      }

      const node = getSelectedNode(selection)

      // Update active state of nodes

      for (const formatButton of editorConfig?.features?.floatingSelectToolbar?.buttons?.format) {
        if (formatButton.isActive) {
          const isActive = formatButton.isActive(editor, selection)
          setActiveStates(activeStates.set(formatButton.key, isActive))
        }
      }

      if (selection.getTextContent() !== '') {
        setIsText($isTextNode(node))
      } else {
        setIsText(false)
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '')
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false)
        return
      }
    })
  }, [editor, activeStates, editorConfig])

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup)
    return () => {
      document.removeEventListener('selectionchange', updatePopup)
    }
  }, [updatePopup])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup()
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false)
        }
      }),
    )
  }, [editor, updatePopup])

  if (!isText) {
    return null
  }

  return createPortal(
    <FloatingSelectToolbar activeStates={activeStates} anchorElem={anchorElem} editor={editor} />,
    anchorElem,
  )
}

export function FloatingSelectToolbarPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  return useFloatingTextFormatToolbar(editor, anchorElem)
}
