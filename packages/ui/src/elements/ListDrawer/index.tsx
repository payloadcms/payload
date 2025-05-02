'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types.js'

export * from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { ListDrawerContent } from './DrawerContent.js'

export const baseClass = 'list-drawer'
export const formatListDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number
  uuid: string // supply when creating a new document and no id is available
}) => `list-drawer_${depth}_${uuid}`

export const ListDrawerToggler: React.FC<ListTogglerProps> = ({
  children,
  className,
  disabled,
  drawerSlug,
  onClick,
  ...rest
}) => {
  return (
    <DrawerToggler
      className={[className, `${baseClass}__toggler`].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
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
  const drawerDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)
  const [collectionSlugs, setCollectionSlugs] = useState(collectionSlugsFromProps)

  const drawerSlug = formatListDrawerSlug({
    depth: drawerDepth,
    uuid,
  })

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
      collectionSlugs,
      drawerDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      setCollectionSlugs,
      toggleDrawer,
    }),
    [
      drawerDepth,
      drawerSlug,
      isOpen,
      toggleDrawer,
      closeDrawer,
      openDrawer,
      setCollectionSlugs,
      collectionSlugs,
    ],
  )

  return [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState]
}
