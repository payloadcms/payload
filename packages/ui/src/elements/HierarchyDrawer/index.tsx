'use client'
import { useModal } from '@faceless-ui/modal'
import { HIERARCHY_PARENT_FIELD } from 'payload/shared'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type {
  HierarchyDrawerProps,
  HierarchyDrawerTogglerProps,
  UseHierarchyDrawer,
} from './types.js'

export * from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { DrawerToggler } from '../Drawer/index.js'
import { baseClass, HierarchyDrawer } from './Drawer/index.js'

export const formatHierarchyDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number
  uuid: string
}): string => `hierarchy-drawer_${depth}_${uuid}`

export const HierarchyDrawerToggler: React.FC<HierarchyDrawerTogglerProps> = ({
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

/**
 * Hook for using a hierarchy drawer for selecting hierarchy items.
 *
 * @example
 * ```tsx
 * const [HierarchyDrawer, HierarchyDrawerToggler, { closeDrawer, openDrawer }] = useHierarchyDrawer({
 *   collectionSlug: 'categories',
 * })
 *
 * return (
 *   <>
 *     <HierarchyDrawer
 *       onSave={(selections) => console.log(selections)}
 *       hasMany={true}
 *     />
 *     <HierarchyDrawerToggler>Select Categories</HierarchyDrawerToggler>
 *   </>
 * )
 * ```
 */
export const useHierarchyDrawer: UseHierarchyDrawer = ({ collectionSlug, Icon }) => {
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug })

  const useAsTitle = collectionConfig?.admin?.useAsTitle
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName ?? HIERARCHY_PARENT_FIELD

  const drawerDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)

  const drawerSlug = formatHierarchyDrawerSlug({
    depth: drawerDepth,
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
  }, [drawerSlug, closeModal])

  const openDrawer = useCallback(() => {
    openModal(drawerSlug)
  }, [drawerSlug, openModal])

  const MemoizedDrawer = useMemo(() => {
    const DrawerComponent: React.FC<HierarchyDrawerProps> = (props) => (
      <HierarchyDrawer
        {...props}
        closeDrawer={closeDrawer}
        collectionSlug={collectionSlug}
        drawerSlug={drawerSlug}
        Icon={Icon}
        key={drawerSlug}
        parentFieldName={parentFieldName}
        useAsTitle={useAsTitle}
      />
    )

    return DrawerComponent
  }, [drawerSlug, closeDrawer, Icon, parentFieldName, collectionSlug, useAsTitle])

  const MemoizedDrawerToggler = useMemo(() => {
    const TogglerComponent: React.FC<Omit<HierarchyDrawerTogglerProps, 'drawerSlug'>> = (props) => (
      <HierarchyDrawerToggler {...props} drawerSlug={drawerSlug} />
    )

    return TogglerComponent
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
