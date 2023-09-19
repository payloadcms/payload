/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useModal } from '@faceless-ui/modal'
import { $isCodeHighlightNode } from '@lexical/code'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { formatDrawerSlug } from 'payload/components/elements'
import { useEditDepth } from 'payload/components/utilities'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { useEditorConfigContext } from '../../config/EditorConfigProvider'
import './index.scss'

function TextFormatFloatingToolbar({
  anchorElem,
  editor,
  isBold,
  isCode,
  isItalic,
  isLink,
  isStrikethrough,
  isSubscript,
  isSuperscript,
  isUnderline,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  isBold: boolean
  isCode: boolean
  isItalic: boolean
  isLink: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  isUnderline: boolean
}): JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null)

  const { editorConfig, uuid } = useEditorConfigContext()
  const { openModal } = useModal()
  const editDepth = useEditDepth()
  const linkDrawerSlug = formatDrawerSlug({
    depth: editDepth,
    slug: `rich-text-link-lexicalRichText` + uuid,
  })

  const insertLink = useCallback(() => {
    if (!isLink) {
      const linkAttributes: LinkAttributes = {
        linkType: 'custom',
        url: 'https://',
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkAttributes)
      openModal(linkDrawerSlug)
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink])

  const insertComment = (): void => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined)
  }

  function mouseMoveListener(e: MouseEvent): void {
    if (popupCharStylesEditorRef?.current != null && (e.buttons === 1 || e.buttons === 3)) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX
        const y = e.clientY
        const elementUnderMouse = document.elementFromPoint(x, y)

        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          popupCharStylesEditorRef.current.style.pointerEvents = 'none'
        }
      }
    }
  }
  function mouseUpListener(e: MouseEvent): void {
    if (popupCharStylesEditorRef?.current != null) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto'
      }
    }
  }

  useEffect(() => {
    if (popupCharStylesEditorRef?.current != null) {
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

      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem)
    }
  }, [editor, anchorElem])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = (): void => {
      editor.getEditorState().read(() => {
        updateTextFormatFloatingToolbar()
      })
    }

    window.addEventListener('resize', update)
    if (scrollerElem != null) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)
      if (scrollerElem != null) {
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
    <div className="floating-text-format-popup" ref={popupCharStylesEditorRef}>
      {editor.isEditable() && (
        <React.Fragment>
          <button
            aria-label="Format text as bold"
            className={`popup-item spaced ${isBold ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
            }}
            type="button"
          >
            <i className="format bold" />
          </button>
          <button
            aria-label="Format text as italics"
            className={`popup-item spaced ${isItalic ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
            }}
            type="button"
          >
            <i className="format italic" />
          </button>
          <button
            aria-label="Format text to underlined"
            className={`popup-item spaced ${isUnderline ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
            }}
            type="button"
          >
            <i className="format underline" />
          </button>
          <button
            aria-label="Format text with a strikethrough"
            className={`popup-item spaced ${isStrikethrough ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
            }}
            type="button"
          >
            <i className="format strikethrough" />
          </button>
          <button
            aria-label="Format Subscript"
            className={`popup-item spaced ${isSubscript ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
            }}
            title="Subscript"
            type="button"
          >
            <i className="format subscript" />
          </button>
          <button
            aria-label="Format Superscript"
            className={`popup-item spaced ${isSuperscript ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
            }}
            title="Superscript"
            type="button"
          >
            <i className="format superscript" />
          </button>
          <button
            aria-label="Insert code block"
            className={`popup-item spaced ${isCode ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
            }}
            type="button"
          >
            <i className="format code" />
          </button>
          <button
            aria-label="Insert link"
            className={'popup-item spaced ' + (isLink ? 'active' : '')}
            onClick={insertLink}
            title="Insert link"
            type="button"
          >
            <i className="format link" />
          </button>
          {editorConfig.features.map((feature) => {
            if (feature?.floatingTextFormatToolbar?.components != null) {
              return feature.floatingTextFormatToolbar?.components?.map((floatingToolbarItem) => {
                return floatingToolbarItem(editor, editorConfig)
              })
            }
            return null
          })}
          {editorConfig.toggles.comments.enabled && (
            <button
              aria-label="Insert comment"
              className="popup-item spaced insert-comment"
              onClick={insertComment}
              type="button"
            >
              <i className="format add-comment" />
            </button>
          )}
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
  const [isLink, setIsLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)

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

      // Update text format
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsSubscript(selection.hasFormat('subscript'))
      setIsSuperscript(selection.hasFormat('superscript'))
      setIsCode(selection.hasFormat('code'))

      // Update links
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }

      if (!$isCodeHighlightNode(selection.anchor.getNode()) && selection.getTextContent() !== '') {
        setIsText($isTextNode(node))
      } else {
        setIsText(false)
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '')
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false)
      }
    })
  }, [editor])

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

  if (!isText || isLink) {
    return null
  }

  return createPortal(
    <TextFormatFloatingToolbar
      anchorElem={anchorElem}
      editor={editor}
      isBold={isBold}
      isCode={isCode}
      isItalic={isItalic}
      isLink={isLink}
      isStrikethrough={isStrikethrough}
      isSubscript={isSubscript}
      isSuperscript={isSuperscript}
      isUnderline={isUnderline}
    />,
    anchorElem,
  )
}

export default function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  return useFloatingTextFormatToolbar(editor, anchorElem)
}
