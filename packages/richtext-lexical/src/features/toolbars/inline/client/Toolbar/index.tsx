'use client'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  getDOMSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import type { PluginComponentWithAnchor } from '../../../../typesClient.js'
import type { ToolbarGroup, ToolbarGroupItem } from '../../../types.js'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import { getDOMRangeRect } from '../../../../../lexical/utils/getDOMRangeRect.js'
import { setFloatingElemPosition } from '../../../../../lexical/utils/setFloatingElemPosition.js'
import { ToolbarButton } from '../../../shared/ToolbarButton/index.js'
import { ToolbarDropdown } from '../../../shared/ToolbarDropdown/index.js'
import './index.scss'

function ButtonGroupItem({
  anchorElem,
  editor,
  item,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  item: ToolbarGroupItem
}): React.ReactNode {
  if (item.Component) {
    return (
      item?.Component && (
        <item.Component anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
      )
    )
  }
  if (!item.ChildComponent) {
    return null
  }

  return (
    <ToolbarButton editor={editor} item={item} key={item.key}>
      <item.ChildComponent />
    </ToolbarButton>
  )
}

function ToolbarGroupComponent({
  anchorElem,
  editor,
  group,
  index,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  group: ToolbarGroup
  index: number
}): React.ReactNode {
  const { editorConfig } = useEditorConfigContext()

  const [DropdownIcon, setDropdownIcon] = React.useState<React.FC | undefined>()

  React.useEffect(() => {
    if (group?.type === 'dropdown' && group.items.length && group.ChildComponent) {
      setDropdownIcon(() => group.ChildComponent)
    } else {
      setDropdownIcon(undefined)
    }
  }, [group])

  const onActiveChange = useCallback(
    ({ activeItems }: { activeItems: ToolbarGroupItem[] }) => {
      if (!activeItems.length) {
        if (group?.type === 'dropdown' && group.items.length && group.ChildComponent) {
          setDropdownIcon(() => group.ChildComponent)
        } else {
          setDropdownIcon(undefined)
        }
        return
      }
      const item = activeItems[0]
      setDropdownIcon(() => item?.ChildComponent)
    },
    [group],
  )

  return (
    <div
      className={`inline-toolbar-popup__group inline-toolbar-popup__group-${group.key}`}
      key={group.key}
    >
      {group.type === 'dropdown' && group.items.length ? (
        DropdownIcon ? (
          <ToolbarDropdown
            anchorElem={anchorElem}
            editor={editor}
            group={group}
            Icon={DropdownIcon}
            maxActiveItems={group.maxActiveItems ?? 1}
            onActiveChange={onActiveChange}
          />
        ) : (
          <ToolbarDropdown
            anchorElem={anchorElem}
            editor={editor}
            group={group}
            maxActiveItems={group.maxActiveItems ?? 1}
            onActiveChange={onActiveChange}
          />
        )
      ) : null}
      {group.type === 'buttons' && group.items.length
        ? group.items.map((item) => {
            return (
              <ButtonGroupItem anchorElem={anchorElem} editor={editor} item={item} key={item.key} />
            )
          })
        : null}
      {index < editorConfig.features.toolbarInline?.groups.length - 1 && (
        <div className="divider" />
      )}
    </div>
  )
}

function InlineToolbar({
  anchorElem,
  editor,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
}): React.ReactNode {
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
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', mouseMoveListener)
    document.addEventListener('mouseup', mouseUpListener)

    return () => {
      document.removeEventListener('mousemove', mouseMoveListener)
      document.removeEventListener('mouseup', mouseUpListener)
    }
  }, [floatingToolbarRef, mouseMoveListener, mouseUpListener])

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection()

    const nativeSelection = getDOMSelection(editor._window)

    if (floatingToolbarRef.current === null) {
      return
    }

    const possibleLinkEditor = anchorElem.querySelector(':scope > .link-editor')
    const isLinkEditorVisible =
      possibleLinkEditor !== null &&
      'style' in possibleLinkEditor &&
      possibleLinkEditor?.style?.['opacity' as keyof typeof possibleLinkEditor.style] === '1'

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
      const offsetIfFlipped = setFloatingElemPosition({
        alwaysDisplayOnTop: isLinkEditorVisible,
        anchorElem,
        floatingElem: floatingToolbarRef.current,
        horizontalPosition: 'center',
        targetRect: rangeRect,
      })

      // Position caret
      if (caretRef.current) {
        setFloatingElemPosition({
          anchorElem: floatingToolbarRef.current,
          anchorFlippedOffset: offsetIfFlipped,
          floatingElem: caretRef.current,
          horizontalOffset: 5,
          horizontalPosition: 'center',
          specialHandlingForCaret: true,
          targetRect: rangeRect,
          verticalGap: 8,
        })
      }
    } else {
      closeFloatingToolbar()
    }
  }, [editor, closeFloatingToolbar, anchorElem])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar()
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
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem])

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar()
    })
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, $updateTextFormatFloatingToolbar])

  return (
    <div className="inline-toolbar-popup" ref={floatingToolbarRef}>
      <div className="caret" ref={caretRef} />
      {editorConfig?.features &&
        editorConfig.features?.toolbarInline?.groups.map((group, i) => {
          return (
            <ToolbarGroupComponent
              anchorElem={anchorElem}
              editor={editor}
              group={group}
              index={i}
              key={group.key}
            />
          )
        })}
    </div>
  )
}

function useInlineToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
): null | React.ReactElement {
  const [isText, setIsText] = useState(false)

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return
      }
      const selection = $getSelection()
      const nativeSelection = getDOMSelection(editor._window)
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

  if (!isText || !editor.isEditable()) {
    return null
  }

  return createPortal(<InlineToolbar anchorElem={anchorElem} editor={editor} />, anchorElem)
}

export const InlineToolbarPlugin: PluginComponentWithAnchor<undefined> = ({ anchorElem }) => {
  const [editor] = useLexicalComposerContext()

  return useInlineToolbar(editor, anchorElem)
}
