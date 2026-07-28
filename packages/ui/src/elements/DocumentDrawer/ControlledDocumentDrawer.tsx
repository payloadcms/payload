'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import type { DocumentDrawerProps } from './types.js'

import { useEditDepth } from '../../providers/EditDepth/index.js'
import { DocumentDrawer, formatDocumentDrawerSlug } from './index.js'

type ControlledDocumentDrawerProps = {
  readonly isOpen: boolean
  readonly onOpenChange?: (isOpen: boolean) => void
} & Omit<DocumentDrawerProps, 'drawerSlug'>

/**
 * A controlled wrapper around `DocumentDrawer` for views that want to drive
 * drawer visibility from state instead of the imperative `useDocumentDrawer` hook.
 */
export const ControlledDocumentDrawer: React.FC<ControlledDocumentDrawerProps> = ({
  id,
  collectionSlug,
  isOpen,
  onOpenChange,
  ...rest
}) => {
  const drawerDepth = useEditDepth()
  const uuid = React.useId()
  const { closeModal, modalState, openModal } = useModal()
  const drawerSlug = React.useMemo(
    () =>
      formatDocumentDrawerSlug({
        id,
        collectionSlug,
        depth: drawerDepth,
        uuid,
      }),
    [collectionSlug, drawerDepth, id, uuid],
  )
  const isDrawerOpen = Boolean(modalState[drawerSlug]?.isOpen)
  const previousIsDrawerOpen = React.useRef(isDrawerOpen)

  React.useEffect(() => {
    if (isOpen && !isDrawerOpen) {
      openModal(drawerSlug)
    }

    if (!isOpen && isDrawerOpen) {
      closeModal(drawerSlug)
    }
  }, [closeModal, drawerSlug, isDrawerOpen, isOpen, openModal])

  React.useEffect(() => {
    if (previousIsDrawerOpen.current !== isDrawerOpen) {
      previousIsDrawerOpen.current = isDrawerOpen
      onOpenChange?.(isDrawerOpen)
    }
  }, [isDrawerOpen, onOpenChange])

  React.useEffect(() => {
    return () => {
      closeModal(drawerSlug)
    }
  }, [closeModal, drawerSlug])

  return (
    <DocumentDrawer {...rest} collectionSlug={collectionSlug} drawerSlug={drawerSlug} id={id} />
  )
}
