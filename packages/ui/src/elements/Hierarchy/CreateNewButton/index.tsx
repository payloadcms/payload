'use client'

import React, { Fragment, useCallback } from 'react'

import { PlusIcon } from '../../../icons/Plus/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import './index.css'

const baseClass = 'hierarchy-create-new'

export type HierarchyCreateNewButtonProps = {
  collectionSlug: string
  /** Document the new item is created under. `null` creates at the root level. */
  parentId: null | number | string
}

export const HierarchyCreateNewButton: React.FC<HierarchyCreateNewButtonProps> = ({
  collectionSlug,
  parentId,
}) => {
  const { t } = useTranslation()
  const { permissions } = useAuth()
  const { getEntityConfig } = useConfig()
  const { refreshTree } = useHierarchy()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const parentFieldName =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy.parentFieldName
      : undefined

  const [DocumentDrawer, , { closeDrawer, openDrawer }] = useDocumentDrawer({
    collectionSlug,
    drawerSlug: `${baseClass}-${collectionSlug}`,
  })

  const handleSave = useCallback(() => {
    refreshTree(collectionSlug)
    closeDrawer()
  }, [closeDrawer, collectionSlug, refreshTree])

  const canCreate = Boolean(permissions?.collections?.[collectionSlug]?.create)

  if (!canCreate || !parentFieldName) {
    return null
  }

  return (
    <Fragment>
      <Button
        aria-label={t('general:createNew')}
        buttonStyle="ghost"
        className={baseClass}
        icon={<PlusIcon />}
        onClick={openDrawer}
        round
      />
      <DocumentDrawer
        // Remount the form when the target parent changes so initialData is picked back up
        initialData={parentId !== null ? { [parentFieldName]: parentId } : undefined}
        key={String(parentId)}
        onSave={handleSave}
      />
    </Fragment>
  )
}
