'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type { TaxonomyDrawerProps, TaxonomyDrawerTogglerProps, UseTaxonomyDrawer } from './types.js'

export * from './types.js'

import { useEditDepth } from '../../../providers/EditDepth/index.js'
import { DrawerToggler } from '../../Drawer/index.js'
import { baseClass, TaxonomyDrawer } from './Drawer/index.js'

export const formatTaxonomyDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number
  uuid: string
}): string => `taxonomy-drawer_${depth}_${uuid}`

export const TaxonomyDrawerToggler: React.FC<TaxonomyDrawerTogglerProps> = ({
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
 * Hook for using a taxonomy drawer for selecting taxonomy items.
 *
 * @example
 * ```tsx
 * const [TaxonomyDrawer, TaxonomyDrawerToggler, { closeDrawer, openDrawer }] = useTaxonomyDrawer({
 *   taxonomySlug: 'categories',
 * })
 *
 * return (
 *   <>
 *     <TaxonomyDrawer
 *       onSave={(selections) => console.log(selections)}
 *       hasMany={true}
 *     />
 *     <TaxonomyDrawerToggler>Select Categories</TaxonomyDrawerToggler>
 *   </>
 * )
 * ```
 */
export const useTaxonomyDrawer: UseTaxonomyDrawer = ({
  Icon,
  parentFieldName = 'parent',
  taxonomySlug,
  useAsTitle,
}) => {
  const drawerDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)

  const drawerSlug = formatTaxonomyDrawerSlug({
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
    const DrawerComponent: React.FC<TaxonomyDrawerProps> = (props) => (
      <TaxonomyDrawer
        {...props}
        closeDrawer={closeDrawer}
        drawerSlug={drawerSlug}
        Icon={Icon}
        key={drawerSlug}
        parentFieldName={parentFieldName}
        taxonomySlug={taxonomySlug}
        useAsTitle={useAsTitle}
      />
    )
    return DrawerComponent
  }, [drawerSlug, closeDrawer, Icon, parentFieldName, taxonomySlug, useAsTitle])

  const MemoizedDrawerToggler = useMemo(() => {
    const TogglerComponent: React.FC<Omit<TaxonomyDrawerTogglerProps, 'drawerSlug'>> = (props) => (
      <TaxonomyDrawerToggler {...props} drawerSlug={drawerSlug} />
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
