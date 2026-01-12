'use client'
import type { BaseSelection } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useModal } from '@payloadcms/ui'
import { $getPreviousSelection, $getSelection, $setSelection } from 'lexical'
import { useCallback, useEffect, useState } from 'react'

/**
 *
 * Wrapper around useModal that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export const useLexicalDrawer = (slug: string, restoreLate?: boolean) => {
  const [editor] = useLexicalComposerContext()
  const [selectionState, setSelectionState] = useState<BaseSelection | null>(null)
  const [wasOpen, setWasOpen] = useState<boolean>(false)

  const { closeModal: closeBaseModal, modalState, toggleModal: toggleBaseModal } = useModal()

  const storeSelection = useCallback(() => {
    editor.read(() => {
      const selection = $getSelection() ?? $getPreviousSelection()
      setSelectionState(selection)
    })
  }, [editor])

  const restoreSelection = useCallback(() => {
    if (selectionState) {
      editor.update(
        () => {
          $setSelection(selectionState.clone())
        },
        { discrete: true, skipTransforms: true },
      )
    }
  }, [editor, selectionState])

  const closeDrawer = useCallback(() => {
    //restoreSelection() // Should already be stored by the useEffect below
    closeBaseModal(slug)
  }, [closeBaseModal, slug])
  const isModalOpen = modalState?.[slug]?.isOpen

  const toggleDrawer = useCallback(() => {
    if (!isModalOpen) {
      storeSelection()
    } else {
      restoreSelection()
    }
    setWasOpen(true)
    toggleBaseModal(slug)
  }, [slug, storeSelection, toggleBaseModal, restoreSelection, isModalOpen])

  // We need to handle drawer closing via a useEffect, as toggleDrawer / closeDrawer will not be triggered if the drawer
  // is closed by clicking outside of the drawer. This useEffect will handle everything.
  useEffect(() => {
    if (!wasOpen) {
      return
    }

    const thisModalState = modalState[slug]
    // Exists in modalState (thus has opened at least once before) and is closed
    if (thisModalState && !thisModalState?.isOpen) {
      setWasOpen(false)

      if (restoreLate) {
        // restoreLate is used for upload extra field drawers. For some reason, the selection is not restored if we call restoreSelection immediately.
        setTimeout(() => {
          restoreSelection()
        }, 0)
      } else {
        restoreSelection()
      }
    }
  }, [modalState, slug, restoreSelection, wasOpen, restoreLate])

  return {
    closeDrawer,
    toggleDrawer,
  }
}
