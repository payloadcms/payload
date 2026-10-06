'use client'

import React, { useCallback, useMemo } from 'react'

import { GearIcon } from '../../../icons/Gear/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'

export function HierarchyEditButton({
  id,
  collectionSlug,
  title,
}: {
  collectionSlug: string
  id: number | string
  title: string
}) {
  const { permissions } = useAuth()
  const { refreshTree } = useHierarchy()
  const { clearRouteCache } = useRouteCache()
  const { t } = useTranslation()
  const drawerProps = useMemo(() => ({ id, collectionSlug }), [id, collectionSlug])
  const [DocumentDrawer, , { closeDrawer, openDrawer }] = useDocumentDrawer(drawerProps)

  const handleSave = useCallback(() => {
    closeDrawer()
    clearRouteCache()
    refreshTree(collectionSlug)
  }, [clearRouteCache, closeDrawer, collectionSlug, refreshTree])

  if (!permissions?.collections?.[collectionSlug]?.update) {
    return null
  }

  return (
    <>
      <Button
        aria-label={t('general:editLabel', { label: title })}
        buttonStyle="ghost"
        className="hierarchy-edit-button"
        icon={<GearIcon />}
        margin={false}
        onClick={openDrawer}
      />
      <DocumentDrawer onSave={handleSave} />
    </>
  )
}
