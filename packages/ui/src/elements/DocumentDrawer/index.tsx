'use client'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { DocumentDrawerProps, DocumentTogglerProps, UseDocumentDrawer } from './types.js'

import { useDrawerDepth } from '../../providers/DrawerDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useRelatedCollections } from '../AddNewRelation/useRelatedCollections.js'
import { Drawer, DrawerToggler, useDrawerSlug } from '../Drawer/index.js'
import { DocumentDrawerContent } from './DrawerContent.js'
import './index.scss'

export const baseClass = 'doc-drawer'

export const DocumentDrawerToggler: React.FC<DocumentTogglerProps> = ({
  id,
  children,
  className,
  collectionSlug,
  disabled,
  drawerSlug,
  ...rest
}) => {
  const { i18n, t } = useTranslation()
  const [collectionConfig] = useRelatedCollections(collectionSlug)

  return (
    <DrawerToggler
      aria-label={t(!id ? 'fields:addNewLabel' : 'general:editLabel', {
        label: getTranslation(collectionConfig.labels.singular, i18n),
      })}
      className={[className, `${baseClass}__toggler`].filter(Boolean).join(' ')}
      disabled={disabled}
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
    <Drawer className={baseClass} gutter={false} Header={null} slug={drawerSlug}>
      <DocumentDrawerContent {...props} />
    </Drawer>
  )
}

export const useDocumentDrawer: UseDocumentDrawer = ({ id, collectionSlug }) => {
  const drawerDepth = useDrawerDepth()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)

  const drawerSlug = useDrawerSlug(`doc-drawer__${collectionSlug}${id ? `_${id}` : ''}`)

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

  const MemoizedDrawer = useMemo(() => {
    return (props) => (
      <DocumentDrawer
        {...props}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
        id={id}
        key={drawerSlug}
      />
    )
  }, [id, drawerSlug, collectionSlug])

  const MemoizedDrawerToggler = useMemo(() => {
    return (props) => (
      <DocumentDrawerToggler
        {...props}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
        id={id}
      />
    )
  }, [id, drawerSlug, collectionSlug])

  const MemoizedDrawerState = useMemo(
    () => ({
      closeDrawer,
      drawerDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer,
    }),
    [drawerDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer, openDrawer],
  )

  return [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState]
}
