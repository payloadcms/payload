'use client'
import type { UseListDrawer } from '@payloadcms/ui'
import type { BaseSelection } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useListDrawer, useModal } from '@payloadcms/ui'
import {
  $getNodeByKey,
  $getPreviousSelection,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
} from 'lexical'
import { useCallback, useEffect, useState } from 'react'

/**
 *
 * Wrapper around useListDrawer that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export const useLexicalListDrawer = (
  args: Parameters<UseListDrawer>[0],
): {
  closeListDrawer: () => void
  isListDrawerOpen: boolean
  ListDrawer: ReturnType<UseListDrawer>[0]
  listDrawerSlug: string
  ListDrawerToggler: ReturnType<UseListDrawer>[1]
  openListDrawer: (selection?: BaseSelection) => void
} => {
  const [editor] = useLexicalComposerContext()
  const [selectionState, setSelectionState] = useState<BaseSelection | null>(null)
  const [wasOpen, setWasOpen] = useState<boolean>(false)

  const [
    BaseListDrawer,
    BaseListDrawerToggler,
    {
      closeDrawer: baseCloseDrawer,
      drawerSlug: listDrawerSlug,
      isDrawerOpen,
      openDrawer: baseOpenDrawer,
    },
  ] = useListDrawer(args)
  const { modalState } = useModal()

  const $storeSelection = useCallback(() => {
    // editor.read() causes an error here when creating a new upload node from the slash menu. It seems like we can omit it here though, as all
    // invocations of that functions are wrapped in editor.read() or editor.update() somewhere in the call stack.
    const selection = $getSelection() ?? $getPreviousSelection()
    setSelectionState(selection)
  }, [])

  const restoreSelection = useCallback(() => {
    if (selectionState) {
      editor.update(
        () => {
          if ($isRangeSelection(selectionState)) {
            const { anchor, focus } = selectionState
            if ($getNodeByKey(anchor.key) && $getNodeByKey(focus.key)) {
              $setSelection(selectionState.clone())
            }
          } else {
            // not ideal, but better than losing the selection. Try to set the selection
            // in a valid place if you remove selected nodes!
            $getRoot().selectEnd()
          }
        },
        { discrete: true, skipTransforms: true },
      )
    }
  }, [editor, selectionState])

  const closeListDrawer = () => {
    //restoreSelection() // Should already be stored by the useEffect below
    baseCloseDrawer()
  }

  // We need to handle drawer closing via a useEffect, as toggleDrawer / closeDrawer will not be triggered if the drawer
  // is closed by clicking outside of the drawer. This useEffect will handle everything.
  useEffect(() => {
    if (!wasOpen) {
      return
    }

    const thisModalState = modalState[listDrawerSlug]
    // Exists in modalState (thus has opened at least once before) and is closed
    if (thisModalState && !thisModalState?.isOpen) {
      setWasOpen(false)
      setTimeout(() => {
        restoreSelection()
      }, 1)
    }
  }, [modalState, listDrawerSlug, restoreSelection, wasOpen])

  return {
    closeListDrawer,
    isListDrawerOpen: isDrawerOpen,
    ListDrawer: BaseListDrawer,
    listDrawerSlug,
    ListDrawerToggler: (props) => (
      <BaseListDrawerToggler
        {...props}
        onClick={() => {
          $storeSelection()
        }}
      />
    ),
    openListDrawer: () => {
      $storeSelection()
      baseOpenDrawer()
      setWasOpen(true)
    },
  }
}
