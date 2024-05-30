'use client'
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import type { FloatingToolbarSection, FloatingToolbarSectionEntry } from './types'

import { useEditorConfigContext } from '../../config/EditorConfigProvider'
import { getDOMRangeRect } from '../../utils/getDOMRangeRect'
import { setFloatingElemPosition } from '../../utils/setFloatingElemPosition'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarDropdown } from './ToolbarDropdown'
import './index.scss'

function ButtonSectionEntry({
  anchorElem,
  editor,
  entry,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  entry: FloatingToolbarSectionEntry
}): JSX.Element {
  const Component = useMemo(() => {
    return entry?.Component
      ? React.lazy(() =>
          entry.Component().then((resolvedComponent) => ({
            default: resolvedComponent,
          })),
        )
      : null
  }, [entry])

  const ChildComponent = useMemo(() => {
    return entry?.ChildComponent
      ? React.lazy(() =>
          entry.ChildComponent().then((resolvedChildComponent) => ({
            default: resolvedChildComponent,
          })),
        )
      : null
  }, [entry])

  if (entry.Component) {
    return (
      Component && (
        <React.Suspense>
          <Component anchorElem={anchorElem} editor={editor} entry={entry} key={entry.key} />{' '}
        </React.Suspense>
      )
    )
  }

  return (
    <ToolbarButton entry={entry} key={entry.key}>
      {ChildComponent && (
        <React.Suspense>
          <ChildComponent />
        </React.Suspense>
      )}
    </ToolbarButton>
  )
}

function ToolbarSection({
  anchorElem,
  editor,
  index,
  section,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  index: number
  section: FloatingToolbarSection
}): JSX.Element {
  const { editorConfig } = useEditorConfigContext()

  const Icon = useMemo(() => {
    return section?.type === 'dropdown' && section.entries.length && section.ChildComponent
      ? React.lazy(() =>
          section.ChildComponent().then((resolvedComponent) => ({
            default: resolvedComponent,
          })),
        )
      : null
  }, [section])

  return (
    <div
      className={`floating-select-toolbar-popup__section floating-select-toolbar-popup__section-${section.key}`}
      key={section.key}
    >
      {section.type === 'dropdown' &&
        section.entries.length &&
        (Icon ? (
          <React.Suspense>
            <ToolbarDropdown
              Icon={Icon}
              anchorElem={anchorElem}
              editor={editor}
              entries={section.entries}
              sectionKey={section.key}
            />
          </React.Suspense>
        ) : (
          <ToolbarDropdown
            anchorElem={anchorElem}
            editor={editor}
            entries={section.entries}
            sectionKey={section.key}
          />
        ))}
      {section.type === 'buttons' &&
        section.entries.length &&
        section.entries.map((entry) => {
          return (
            <ButtonSectionEntry
              anchorElem={anchorElem}
              editor={editor}
              entry={entry}
              key={entry.key}
            />
          )
        })}
      {index < editorConfig.features.floatingSelectToolbar?.sections.length - 1 && (
        <div className="divider" />
      )}
    </div>
  )
}

function FloatingSelectToolbar({
  anchorElem,
  editor,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
}): JSX.Element {
  const floatingToolbarRef = useRef<HTMLDivElement | null>(null)
  const caretRef = useRef<HTMLDivElement | null>(null)

  const { editorConfig } = useEditorConfigContext()

  const closeFloatingToolbar = useCallback(() => {
    if (floatingToolbarRef?.current) {
      const isOpacityZero = floatingToolbarRef.current.style.opacity === '0'
      const isPointerEventsNone = floatingToolbarRef.current.style.pointerEvents === 'none'

      if (!isOpacityZero) {
        floatingToolbarRef.current.style.opacity = '0'
      }
      if (!isPointerEventsNone) {
        floatingToolbarRef.current.style.pointerEvents = 'none'
      }
    }
  }, [floatingToolbarRef])

  const mouseMoveListener = useCallback(
    (e: MouseEvent) => {
      if (floatingToolbarRef?.current && (e.buttons === 1 || e.buttons === 3)) {
        const isOpacityZero = floatingToolbarRef.current.style.opacity === '0'
        const isPointerEventsNone = floatingToolbarRef.current.style.pointerEvents === 'none'
        if (!isOpacityZero || !isPointerEventsNone) {
          // Check if the mouse is not over the popup
          const x = e.clientX
          const y = e.clientY
          const elementUnderMouse = document.elementFromPoint(x, y)
          if (!floatingToolbarRef.current.contains(elementUnderMouse)) {
            // Mouse is not over the target element => not a normal click, but probably a drag
            closeFloatingToolbar()
          }
        }
      }
    },
    [closeFloatingToolbar],
  )

  const mouseUpListener = useCallback(() => {
    if (floatingToolbarRef?.current) {
      if (floatingToolbarRef.current.style.opacity !== '1') {
        floatingToolbarRef.current.style.opacity = '1'
      }
      if (floatingToolbarRef.current.style.pointerEvents !== 'auto') {
        floatingToolbarRef.current.style.pointerEvents = 'auto'
      }
    }
  }, [floatingToolbarRef])

  useEffect(() => {
    document.addEventListener('mousemove', mouseMoveListener)
    document.addEventListener('mouseup', mouseUpListener)

    return () => {
      document.removeEventListener('mousemove', mouseMoveListener)
      document.removeEventListener('mouseup', mouseUpListener)
    }
  }, [floatingToolbarRef, mouseMoveListener, mouseUpListener])

  const updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection()

    const nativeSelection = window.getSelection()

    if (floatingToolbarRef.current === null) {
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

      // Position floating toolbar
      const offsetIfFlipped = setFloatingElemPosition(
        rangeRect, // selection to position around
        floatingToolbarRef.current, // what to position
        anchorElem, // anchor elem
        'center',
      )

      // Position caret
      if (caretRef.current) {
        setFloatingElemPosition(
          rangeRect, // selection to position around
          caretRef.current, // what to position
          floatingToolbarRef.current, // anchor elem
          'center',
          10,
          5,
          true,
          offsetIfFlipped,
        )
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
    <div className="floating-select-toolbar-popup" ref={floatingToolbarRef}>
      <div className="caret" ref={caretRef} />
      {editor.isEditable() && (
        <React.Fragment>
          {editorConfig?.features &&
            editorConfig.features?.floatingSelectToolbar?.sections.map((section, i) => {
              return (
                <ToolbarSection
                  anchorElem={anchorElem}
                  editor={editor}
                  index={i}
                  key={section.key}
                  section={section}
                />
              )
            })}
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

      if (selection.getTextContent() !== '') {
        const nodes = selection.getNodes()
        let foundNodeWithText = false
        for (const node of nodes) {
          if ($isTextNode(node)) {
            setIsText(true)
            foundNodeWithText = true
            break
          }
        }
        if (!foundNodeWithText) {
          setIsText(false)
        }
      } else {
        setIsText(false)
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '')
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false)
        return
      }
    })
  }, [editor])

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup)
    document.addEventListener('mouseup', updatePopup)
    return () => {
      document.removeEventListener('selectionchange', updatePopup)
      document.removeEventListener('mouseup', updatePopup)
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

  return createPortal(<FloatingSelectToolbar anchorElem={anchorElem} editor={editor} />, anchorElem)
}

export function FloatingSelectToolbarPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  return useFloatingTextFormatToolbar(editor, anchorElem)
}
