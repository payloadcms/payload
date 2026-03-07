'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useId, useMemo, useRef } from 'react'

import type {
  HierarchyDrawerProps,
  HierarchyDrawerTogglerProps,
  UseHierarchyDrawer,
} from './types.js'

export * from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
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
export const useHierarchyDrawer: UseHierarchyDrawer = ({
  disabledIds,
  filterByCollection: filterByCollectionProp,
  hierarchyCollectionSlug,
  Icon,
}) => {
  const { getEntityConfig } = useConfig()
  const { allowedCollections } = useHierarchy()
  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })

  const useAsTitle = collectionConfig?.admin?.useAsTitle
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName

  // Use explicit prop if provided, otherwise fall back to allowedCollections from context
  // - allowedCollections is null/undefined: no filtering (undefined)
  // - allowedCollections is []: folder accepts everything, show only unrestricted destinations ([])
  // - allowedCollections has values: show folders accepting those types
  // Memoize to prevent new array references on every render
  const filterByCollection = useMemo(() => {
    if (filterByCollectionProp !== undefined) {
      return filterByCollectionProp
    }
    return allowedCollections !== null ? allowedCollections.map((c) => c.slug) : undefined
  }, [filterByCollectionProp, allowedCollections])

  const drawerDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, openModal, toggleModal } = useModal()

  const drawerSlug = formatHierarchyDrawerSlug({
    depth: drawerDepth,
    uuid,
  })

  // Store modal functions in refs to ensure stable callbacks
  // This prevents re-renders when other modals (like DocumentDrawer) change state
  const closeModalRef = useRef(closeModal)
  const openModalRef = useRef(openModal)
  const toggleModalRef = useRef(toggleModal)
  closeModalRef.current = closeModal
  openModalRef.current = openModal
  toggleModalRef.current = toggleModal

  // Stable callbacks using refs - these will NEVER change
  const toggleDrawer = useCallback(() => {
    toggleModalRef.current(drawerSlug)
  }, [drawerSlug])

  const closeDrawer = useCallback(() => {
    closeModalRef.current(drawerSlug)
  }, [drawerSlug])

  const openDrawer = useCallback(() => {
    openModalRef.current(drawerSlug)
  }, [drawerSlug])

  const MemoizedDrawer = useMemo(() => {
    const DrawerComponent: React.FC<HierarchyDrawerProps> = (props) => (
      <HierarchyDrawer
        {...props}
        closeDrawer={closeDrawer}
        disabledIds={disabledIds}
        drawerSlug={drawerSlug}
        filterByCollection={filterByCollection}
        hierarchyCollectionSlug={hierarchyCollectionSlug}
        Icon={Icon}
        key={drawerSlug}
        parentFieldName={parentFieldName}
        useAsTitle={useAsTitle}
      />
    )

    return DrawerComponent
  }, [
    drawerSlug,
    closeDrawer,
    disabledIds,
    filterByCollection,
    Icon,
    parentFieldName,
    hierarchyCollectionSlug,
    useAsTitle,
  ])

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
      // Note: Not tracking isDrawerOpen to prevent re-renders when other modals change state
      // Consumers needing this can use useModal() directly
      isDrawerOpen: false,
      openDrawer,
      toggleDrawer,
    }),
    [drawerDepth, drawerSlug, toggleDrawer, closeDrawer, openDrawer],
  )

  return [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState]
}
