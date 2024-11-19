'use client'
import type { UseDocumentDrawer } from '@payloadcms/ui'
import type { BaseSelection } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useDocumentDrawer, useModal } from '@payloadcms/ui'
import { $getPreviousSelection, $getSelection, $setSelection } from 'lexical'
import { useCallback, useEffect, useState } from 'react'

/**
 *
 * Wrapper around useDocumentDrawer that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export const useLexicalDocumentDrawer = (
  args: Parameters<UseDocumentDrawer>[0],
): {
  closeDocumentDrawer: () => void
  DocumentDrawer: ReturnType<UseDocumentDrawer>[0]
  documentDrawerSlug: string
  DocumentDrawerToggler: ReturnType<UseDocumentDrawer>[1]
} => {
  const [editor] = useLexicalComposerContext()
  const [selectionState, setSelectionState] = useState<BaseSelection | null>(null)
  const [wasOpen, setWasOpen] = useState<boolean>(false)

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
    { closeDrawer: closeDrawer, drawerSlug: documentDrawerSlug },
  ] = useDocumentDrawer(args)
  const { modalState } = useModal()

  const storeSelection = useCallback(() => {
    editor.read(() => {
      const selection = $getSelection() ?? $getPreviousSelection()
      setSelectionState(selection)
    })
    setWasOpen(true)
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

  const closeDocumentDrawer = () => {
    //restoreSelection() // Should already be stored by the useEffect below
    closeDrawer()
  }

  // We need to handle drawer closing via a useEffect, as toggleDrawer / closeDrawer will not be triggered if the drawer
  // is closed by clicking outside of the drawer. This useEffect will handle everything.
  useEffect(() => {
    if (!wasOpen) {
      return
    }

    const thisModalState = modalState[documentDrawerSlug]
    // Exists in modalState (thus has opened at least once before) and is closed
    if (thisModalState && !thisModalState?.isOpen) {
      setWasOpen(false)
      setTimeout(() => {
        restoreSelection()
      }, 1)
    }
  }, [modalState, documentDrawerSlug, restoreSelection, wasOpen])

  return {
    closeDocumentDrawer,
    DocumentDrawer,
    documentDrawerSlug,
    DocumentDrawerToggler: (props) => <DocumentDrawerToggler {...props} onClick={storeSelection} />,
  }
}
