'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types.js'

export * from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useDrawerDepth } from '../../providers/DrawerDepth/index.js'
import { Drawer, DrawerToggler, useDrawerSlug } from '../Drawer/index.js'
import { ListDrawerContent } from './DrawerContent.js'
import './index.scss'

export const baseClass = 'list-drawer'

export const ListDrawerToggler: React.FC<ListTogglerProps> = ({
  children,
  className,
  disabled,
  drawerSlug,
  ...rest
}) => {
  return (
    <DrawerToggler
      className={[className, `${baseClass}__toggler`].filter(Boolean).join(' ')}
      disabled={disabled}
      slug={drawerSlug}
      {...rest}
    >
      {children}
    </DrawerToggler>
  )
}

export const ListDrawer: React.FC<ListDrawerProps> = (props) => {
  const { drawerSlug } = props

  return (
    <Drawer className={baseClass} gutter={false} Header={null} slug={drawerSlug}>
      <ListDrawerContent {...props} />
    </Drawer>
  )
}

export const useListDrawer: UseListDrawer = ({
  collectionSlugs: collectionSlugsFromProps,
  filterOptions,
  selectedCollection,
  uploads,
}) => {
  const {
    config: { collections },
  } = useConfig()
  const drawerDepth = useDrawerDepth()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)
  const [collectionSlugs, setCollectionSlugs] = useState(collectionSlugsFromProps)

  const drawerSlug = useDrawerSlug(`list-drawer`)

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  useEffect(() => {
    if (!collectionSlugs || collectionSlugs.length === 0) {
      const filteredCollectionSlugs = collections.filter(({ upload }) => {
        if (uploads) {
          return Boolean(upload) === true
        }
        return true
      })

      setCollectionSlugs(filteredCollectionSlugs.map(({ slug }) => slug))
    }
  }, [collectionSlugs, uploads, collections])

  const toggleDrawer = useCallback(() => {
    toggleModal(drawerSlug)
  }, [toggleModal, drawerSlug])

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug)
  }, [drawerSlug, closeModal])

  const openDrawer = useCallback(() => {
    openModal(drawerSlug)
  }, [drawerSlug, openModal])

  const MemoizedDrawer = useMemo(() => {
    return (props) => (
      <ListDrawer
        {...props}
        closeDrawer={closeDrawer}
        collectionSlugs={collectionSlugs}
        drawerSlug={drawerSlug}
        filterOptions={filterOptions}
        key={drawerSlug}
        selectedCollection={selectedCollection}
        uploads={uploads}
      />
    )
  }, [drawerSlug, collectionSlugs, uploads, closeDrawer, selectedCollection, filterOptions])

  const MemoizedDrawerToggler = useMemo(() => {
    return (props) => <ListDrawerToggler {...props} drawerSlug={drawerSlug} />
  }, [drawerSlug])

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
