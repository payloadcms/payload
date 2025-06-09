'use client'
import { Drawer, useEditDepth, useModal, useTranslation } from '@payloadcms/ui'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import './index.scss'

export const baseClass = 'version-drawer'
export const formatVersionDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number
  uuid: string // supply when creating a new document and no id is available
}) => `version-drawer_${depth}_${uuid}`

export const VersionDrawer: React.FC<{
  drawerSlug: string
  VersionsView: React.ReactNode
}> = (props) => {
  const { drawerSlug, VersionsView } = props
  const { t } = useTranslation()

  return (
    <Drawer
      className={baseClass}
      gutter={true}
      slug={drawerSlug}
      title={t('version:selectVersionToCompare')}
    >
      {VersionsView}
    </Drawer>
  )
}

export const useVersionDrawer = ({ VersionsView }: { VersionsView: React.ReactNode }) => {
  const drawerDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)

  const drawerSlug = formatVersionDrawerSlug({
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
    return () => <VersionDrawer drawerSlug={drawerSlug} VersionsView={VersionsView} />
  }, [drawerSlug, VersionsView])

  return useMemo(
    () => ({
      closeDrawer,
      Drawer: MemoizedDrawer,
      drawerDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer,
    }),
    [MemoizedDrawer, closeDrawer, drawerDepth, drawerSlug, isOpen, openDrawer, toggleDrawer],
  )
}
