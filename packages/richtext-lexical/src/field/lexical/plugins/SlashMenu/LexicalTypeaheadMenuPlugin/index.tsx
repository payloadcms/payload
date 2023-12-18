'use client'
import type {
  LexicalCommand,
  LexicalEditor,
  ParagraphNode,
  RangeSelection,
  TextNode,
} from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
} from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import * as React from 'react'

import type { MenuRenderFn, MenuResolution } from './LexicalMenu'
import type { SlashMenuGroup, SlashMenuOption } from './types'

import { MenuTextMatch, TriggerFn } from '../useMenuTriggerMatch'
import { LexicalMenu, useMenuAnchorRef } from './LexicalMenu'

export const PUNCTUATION = '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;'

function getTextUpToAnchor(selection: RangeSelection): null | string {
  const anchor = selection.anchor
  if (anchor.type !== 'text') {
    return null
  }
  const anchorNode = anchor.getNode()
  if (!anchorNode.isSimpleText()) {
    return null
  }
  const anchorOffset = anchor.offset
  return anchorNode.getTextContent().slice(0, anchorOffset)
}

function tryToPositionRange(leadOffset: number, range: Range, editorWindow: Window): boolean {
  const domSelection = editorWindow.getSelection()
  if (domSelection === null || !domSelection.isCollapsed) {
    return false
  }
  const anchorNode = domSelection.anchorNode
  const startOffset = leadOffset
  const endOffset = domSelection.anchorOffset

  if (anchorNode == null || endOffset == null) {
    return false
  }

  try {
    range.setStart(anchorNode, startOffset)
    // if endOffset is 0, positioning the range for when you click the plus button to open the slash menu will fial
    range.setEnd(anchorNode, endOffset > 1 ? endOffset : 1)
  } catch (error) {
    return false
  }

  return true
}

function getQueryTextForSearch(editor: LexicalEditor): null | string {
  let text = null
  editor.getEditorState().read(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }
    text = getTextUpToAnchor(selection)
  })
  return text
}

function isSelectionOnEntityBoundary(editor: LexicalEditor, offset: number): boolean {
  if (offset !== 0) {
    return false
  }
  return editor.getEditorState().read(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor
      const anchorNode = anchor.getNode()
      const prevSibling = anchorNode.getPreviousSibling()
      return $isTextNode(prevSibling) && prevSibling.isTextEntity()
    }
    return false
  })
}

function startTransition(callback: () => void) {
  if (React.startTransition) {
    React.startTransition(callback)
  } else {
    callback()
  }
}

// Got from https://stackoverflow.com/a/42543908/2013580
export function getScrollParent(
  element: HTMLElement,
  includeHidden: boolean,
): HTMLBodyElement | HTMLElement {
  let style = getComputedStyle(element)
  const excludeStaticParent = style.position === 'absolute'
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/
  if (style.position === 'fixed') {
    return document.body
  }
  for (let parent: HTMLElement | null = element; (parent = parent.parentElement); ) {
    style = getComputedStyle(parent)
    if (excludeStaticParent && style.position === 'static') {
      continue
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent
    }
  }
  return document.body
}

export { useDynamicPositioning } from './LexicalMenu'

export type TypeaheadMenuPluginProps = {
  anchorClassName?: string
  anchorElem: HTMLElement
  groupsWithOptions: Array<SlashMenuGroup>
  menuRenderFn: MenuRenderFn
  onClose?: () => void
  onOpen?: (resolution: MenuResolution) => void
  onQueryChange: (matchingString: null | string) => void
  onSelectOption: (
    option: SlashMenuOption,
    textNodeContainingQuery: TextNode | null,
    closeMenu: () => void,
    matchingString: string,
  ) => void
  triggerFn: TriggerFn
}

export const ENABLE_SLASH_MENU_COMMAND: LexicalCommand<{
  node: ParagraphNode
}> = createCommand('ENABLE_SLASH_MENU_COMMAND')

export function LexicalTypeaheadMenuPlugin({
  anchorClassName,
  anchorElem,
  groupsWithOptions,
  menuRenderFn,
  onClose,
  onOpen,
  onQueryChange,
  onSelectOption,
  triggerFn,
}: TypeaheadMenuPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [resolution, setResolution] = useState<MenuResolution | null>(null)
  const anchorElementRef = useMenuAnchorRef(anchorElem, resolution, setResolution, anchorClassName)

  const closeTypeahead = useCallback(() => {
    setResolution(null)
    if (onClose != null && resolution !== null) {
      onClose()
    }
  }, [onClose, resolution])

  const openTypeahead = useCallback(
    (res: MenuResolution) => {
      setResolution(res)
      if (onOpen != null && resolution === null) {
        onOpen(res)
      }
    },
    [onOpen, resolution],
  )

  // This is mainly used for the AddBlockHandlePlugin, so that the slash menu can be opened from there
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        ENABLE_SLASH_MENU_COMMAND,
        ({ node }) => {
          editor.getEditorState().read(() => {
            const match: MenuTextMatch = {
              leadOffset: 0,
              matchingString: '',
              replaceableString: '',
            }
            if (match !== null && !isSelectionOnEntityBoundary(editor, match.leadOffset)) {
              if (node !== null) {
                const editorWindow = editor._window ?? window
                const range = editorWindow.document.createRange()

                const isRangePositioned = tryToPositionRange(match.leadOffset, range, editorWindow)
                if (isRangePositioned !== null) {
                  startTransition(() =>
                    openTypeahead({
                      getRect: () => {
                        return range.getBoundingClientRect()
                      },
                      match,
                    }),
                  )
                }

                return
              }
            }
          })

          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, openTypeahead])

  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const editorWindow = editor._window ?? window
        const range = editorWindow.document.createRange()
        const selection = $getSelection()
        const text = getQueryTextForSearch(editor)

        if (
          !$isRangeSelection(selection) ||
          !selection.isCollapsed() ||
          text === null ||
          range === null
        ) {
          closeTypeahead()
          return
        }

        const match = triggerFn({ editor, query: text })
        onQueryChange(match ? match.matchingString : null)

        if (match !== null && !isSelectionOnEntityBoundary(editor, match.leadOffset)) {
          const isRangePositioned = tryToPositionRange(match.leadOffset, range, editorWindow)
          if (isRangePositioned !== null) {
            startTransition(() =>
              openTypeahead({
                getRect: () => {
                  return range.getBoundingClientRect()
                },
                match,
              }),
            )
            return
          }
        }
        closeTypeahead()
      })
    }

    const removeUpdateListener = editor.registerUpdateListener(updateListener)

    return () => {
      removeUpdateListener()
    }
  }, [editor, triggerFn, onQueryChange, resolution, closeTypeahead, openTypeahead])

  return resolution === null || editor === null ? null : (
    <LexicalMenu
      anchorElementRef={anchorElementRef}
      close={closeTypeahead}
      editor={editor}
      groupsWithOptions={groupsWithOptions}
      menuRenderFn={menuRenderFn}
      onSelectOption={onSelectOption}
      resolution={resolution}
      shouldSplitNodeWithQuery
    />
  )
}

export { MenuRenderFn, MenuResolution, MenuTextMatch, TriggerFn }
