'use client'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useMemo, useState } from 'react'

import type { SelectionWithPath, TaxonomyDrawerInternalProps } from '../types.js'

import { TagIcon } from '../../../../icons/Tag/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Drawer } from '../../../Drawer/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { ColumnBrowser } from '../ColumnBrowser/index.js'
import './index.scss'

export const baseClass = 'taxonomy-drawer'

export const TaxonomyDrawerContent: React.FC<TaxonomyDrawerInternalProps> = ({
  closeDrawer,
  drawerSlug,
  hasMany = false,
  Icon,
  initialSelections,
  onSave,
  parentFieldName,
  taxonomySlug,
  useAsTitle,
}) => {
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: taxonomySlug })
  const collectionLabel = collectionConfig
    ? getTranslation(collectionConfig.labels?.plural || taxonomySlug, i18n)
    : taxonomySlug

  const [selections, setSelections] = useState<Map<number | string, SelectionWithPath>>(() => {
    const map = new Map<number | string, SelectionWithPath>()
    if (initialSelections) {
      for (const id of initialSelections) {
        map.set(id, { id, path: [] })
      }
    }
    return map
  })

  const selectedIds = useMemo(() => new Set(selections.keys()), [selections])

  // For now, ancestorsWithSelections is empty - will be computed when we have path tracking
  const ancestorsWithSelections = useMemo(() => new Set<number | string>(), [])

  const handleCancel = useCallback(() => {
    closeModal(drawerSlug)
    closeDrawer()
  }, [closeModal, closeDrawer, drawerSlug])

  const handleSave = useCallback(() => {
    onSave(selections)
    closeModal(drawerSlug)
    closeDrawer()
  }, [onSave, selections, closeModal, closeDrawer, drawerSlug])

  const handleSelect = useCallback(
    (id: number | string) => {
      setSelections((prev) => {
        const next = new Map(prev)

        if (next.has(id)) {
          next.delete(id)
        } else {
          if (!hasMany) {
            // Single select: clear previous selections
            next.clear()
          }
          next.set(id, { id, path: [] })
        }

        return next
      })
    },
    [hasMany],
  )

  const handleClearAll = useCallback(() => {
    setSelections(new Map())
  }, [])

  const selectionCount = selections.size

  return (
    <div className={`${baseClass}__content`}>
      <DrawerActionHeader
        onCancel={handleCancel}
        onSave={handleSave}
        saveLabel={t('general:select')}
        title={t('general:selectValue', { label: collectionLabel })}
      />
      <div className={`${baseClass}__subheader`}>
        <div className={`${baseClass}__subheader-left`}>
          {Icon || <TagIcon />}
          <h4>{collectionLabel}</h4>
        </div>
        <div className={`${baseClass}__subheader-right`}>
          {selectionCount > 0 && (
            <>
              <span className={`${baseClass}__selection-info`}>{selectionCount} selected</span>
              <span>—</span>
              <button className={`${baseClass}__clear-all`} onClick={handleClearAll} type="button">
                {t('general:clearAll')}
              </button>
            </>
          )}
        </div>
      </div>
      <div className={`${baseClass}__columns`}>
        <ColumnBrowser
          ancestorsWithSelections={ancestorsWithSelections}
          onSelect={handleSelect}
          parentFieldName={parentFieldName}
          selectedIds={selectedIds}
          taxonomySlug={taxonomySlug}
          useAsTitle={useAsTitle}
        />
      </div>
    </div>
  )
}

export const TaxonomyDrawer: React.FC<TaxonomyDrawerInternalProps> = (props) => {
  const { drawerSlug } = props

  return (
    <Drawer className={baseClass} gutter={false} Header={null} slug={drawerSlug}>
      <TaxonomyDrawerContent {...props} />
    </Drawer>
  )
}
