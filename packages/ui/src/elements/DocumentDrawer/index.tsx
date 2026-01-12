'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type {
  DocumentDrawerProps,
  DocumentTogglerProps,
  UseDocumentDrawer,
  UseDocumentDrawerContext,
} from './types.js'

import { useRelatedCollections } from '../../hooks/useRelatedCollections.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { DocumentDrawerContent } from './DrawerContent.js'
import './index.scss'

export const documentDrawerBaseClass = 'doc-drawer'

const formatDocumentDrawerSlug = ({
  id,
  collectionSlug,
  depth,
  uuid,
}: {
  collectionSlug: string
  depth: number
  id?: number | string
  uuid: string
}) => `doc-drawer_${collectionSlug}_${depth}${id ? `_${id}` : ''}_${uuid}`

export const DocumentDrawerToggler: React.FC<DocumentTogglerProps> = ({
  children,
  className,
  collectionSlug,
  disabled,
  drawerSlug,
  onClick,
  operation,
  ...rest
}) => {
  const { t } = useTranslation()
  const [collectionConfig] = useRelatedCollections(collectionSlug)

  return (
    <DrawerToggler
      aria-label={t(operation === 'create' ? 'fields:addNewLabel' : 'general:editLabel', {
        label: collectionConfig?.labels.singular,
      })}
      className={[className, `${documentDrawerBaseClass}__toggler`].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
      slug={drawerSlug}
      {...rest}
    >
      {children}
    </DrawerToggler>
  )
}

export const DocumentDrawer: React.FC<DocumentDrawerProps> = (props) => {
  const { drawerSlug } = props

  return (
    <Drawer className={documentDrawerBaseClass} gutter={false} Header={null} slug={drawerSlug}>
      <DocumentDrawerContent {...props} />
    </Drawer>
  )
}

/**
 * A hook to manage documents from a drawer modal.
 * It provides the components and methods needed to open, close, and interact with the drawer.
 * @example
 * const [DocumentDrawer, DocumentDrawerToggler, { openDrawer, closeDrawer }] = useDocumentDrawer({
 *   collectionSlug: 'posts',
 *   id: postId, // optional, if not provided, it will render the "create new" view
 * })
 *
 * // ...
 *
 * return (
 *   <div>
 *     <DocumentDrawerToggler collectionSlug="posts" id={postId}>
 *       Edit Post
 *    </DocumentDrawerToggler>
 *    <DocumentDrawer collectionSlug="posts" id={postId} />
 *  </div>
 */
export const useDocumentDrawer: UseDocumentDrawer = ({
  id,
  collectionSlug,
  overrideEntityVisibility,
}) => {
  const editDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)

  const drawerSlug = formatDocumentDrawerSlug({
    id,
    collectionSlug,
    depth: editDepth,
    uuid,
  })

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  const toggleDrawer = useCallback(() => {
    toggleModal(drawerSlug)
  }, [toggleModal, drawerSlug])

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug)
  }, [closeModal, drawerSlug])

  const openDrawer = useCallback(() => {
    openModal(drawerSlug)
  }, [openModal, drawerSlug])

  const MemoizedDrawer = useMemo<React.FC<DocumentDrawerProps>>(() => {
    return (props) => (
      <DocumentDrawer
        {...props}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
        id={id}
        key={drawerSlug}
        overrideEntityVisibility={overrideEntityVisibility}
      />
    )
  }, [id, drawerSlug, collectionSlug, overrideEntityVisibility])

  const MemoizedDrawerToggler = useMemo<React.FC<DocumentTogglerProps>>(() => {
    return (props) => (
      <DocumentDrawerToggler
        {...props}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
        operation={!id ? 'create' : 'update'}
      />
    )
  }, [id, drawerSlug, collectionSlug])

  const MemoizedDrawerState = useMemo<UseDocumentDrawerContext>(
    () => ({
      closeDrawer,
      drawerDepth: editDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer,
    }),
    [editDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer, openDrawer],
  )

  return [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState]
}
