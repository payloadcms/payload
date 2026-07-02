'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useId, useMemo, useRef, useState } from 'react'

import type { HierarchyModalProps, HierarchyModalTogglerProps, UseHierarchyModal } from './types.js'

export * from './types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useEditDepth } from '../../../providers/EditDepth/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { DrawerToggler as ModalToggler } from '../../Drawer/index.js'
import { baseClass, HierarchyModal } from './index.js'

export const formatHierarchyModalSlug = ({
  depth,
  uuid,
}: {
  depth: number
  uuid: string
}): string => `hierarchy-modal_${depth}_${uuid}`

export const HierarchyModalToggler: React.FC<HierarchyModalTogglerProps> = ({
  children,
  className,
  disabled,
  modalSlug,
  onClick,
  ...rest
}) => {
  return (
    <ModalToggler
      className={[className, `${baseClass}__toggler`].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
      slug={modalSlug}
      {...rest}
    >
      {children}
    </ModalToggler>
  )
}

/**
 * Hook for using a hierarchy modal for selecting hierarchy items.
 *
 * @example
 * ```tsx
 * const [HierarchyModal, HierarchyModalToggler, { closeModal, openModal }] = useHierarchyModal({
 *   collectionSlug: 'categories',
 * })
 *
 * return (
 *   <>
 *     <HierarchyModal
 *       onSave={(selections) => console.log(selections)}
 *       hasMany={true}
 *     />
 *     <HierarchyModalToggler>Select Categories</HierarchyModalToggler>
 *   </>
 * )
 * ```
 */
export const useHierarchyModal: UseHierarchyModal = ({
  disabledIds,
  filterByCollection: filterByCollectionProp,
  hierarchyCollectionSlug,
  Icon,
}) => {
  const { getEntityConfig } = useConfig()
  const { allowedCollections, baseFilter } = useHierarchy()
  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })

  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const useAsTitle = collectionConfig?.admin?.useAsTitle
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

  const modalDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, openModal, toggleModal } = useModal()
  const [reopenCount, setReopenCount] = useState(0)

  const modalSlug = formatHierarchyModalSlug({
    depth: modalDepth,
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
  const toggleHierarchyModal = useCallback(() => {
    toggleModalRef.current(modalSlug)
  }, [modalSlug])

  const closeHierarchyModal = useCallback(() => {
    closeModalRef.current(modalSlug)
  }, [modalSlug])

  const openHierarchyModal = useCallback(() => {
    setReopenCount((count) => count + 1)
    openModalRef.current(modalSlug)
  }, [modalSlug])

  const MemoizedModal = useMemo(() => {
    const ModalComponent: React.FC<HierarchyModalProps> = (props) => (
      <HierarchyModal
        key={modalSlug}
        {...props}
        baseFilter={baseFilter}
        closeModal={closeHierarchyModal}
        disabledIds={disabledIds}
        filterByCollection={filterByCollection}
        hierarchyCollectionSlug={hierarchyCollectionSlug}
        Icon={Icon}
        modalSlug={modalSlug}
        parentFieldName={parentFieldName}
        reopenCount={reopenCount}
        useAsTitle={useAsTitle}
      />
    )

    return ModalComponent
  }, [
    baseFilter,
    closeHierarchyModal,
    disabledIds,
    filterByCollection,
    Icon,
    modalSlug,
    parentFieldName,
    reopenCount,
    hierarchyCollectionSlug,
    useAsTitle,
  ])

  const MemoizedModalToggler = useMemo(() => {
    const TogglerComponent: React.FC<Omit<HierarchyModalTogglerProps, 'modalSlug'>> = (props) => (
      <HierarchyModalToggler {...props} modalSlug={modalSlug} />
    )

    return TogglerComponent
  }, [modalSlug])

  const MemoizedModalState = useMemo(
    () => ({
      closeModal: closeHierarchyModal,
      modalDepth,
      modalSlug,
      // Note: Not tracking isModalOpen to prevent re-renders when other modals change state
      // Consumers needing this can use useModal() directly
      isModalOpen: false,
      openModal: openHierarchyModal,
      toggleModal: toggleHierarchyModal,
    }),
    [closeHierarchyModal, modalDepth, modalSlug, openHierarchyModal, toggleHierarchyModal],
  )

  return [MemoizedModal, MemoizedModalToggler, MemoizedModalState]
}
