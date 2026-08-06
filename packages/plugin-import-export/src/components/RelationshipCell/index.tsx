'use client'
import { useConfig, useTranslation } from '@payloadcms/ui'
import React from 'react'

import { getRelationshipGroups } from './getRelationshipGroups.js'
import './index.css'

const baseClass = 'import-preview-relationship'

type Props = {
  /** `field.relationTo` — an array when the field is polymorphic. */
  relationTo: string | string[]
  value: unknown
}

/**
 * Renders a relationship or upload value for the import preview table, stacking
 * one row per target collection.
 */
export const RelationshipCell: React.FC<Props> = ({ relationTo, value }) => {
  const { config } = useConfig()
  const { i18n } = useTranslation()

  const groups = getRelationshipGroups({
    collections: config.collections,
    dateFormat: config.admin.dateFormat,
    i18n,
    relationTo,
    value,
  })

  // The column heading already names a monomorphic field, whose collection never varies.
  const showCollectionLabels = Array.isArray(relationTo)

  if (!groups.length) {
    return null
  }

  return (
    <div className={baseClass}>
      {groups.map(({ label, options, remaining }, index) => (
        <div className={`${baseClass}__group`} key={label || index}>
          {/* A `label` element would be unassociated here — the cell holds no control */}
          {showCollectionLabels && label && (
            <span className={`${baseClass}__collection`}>{label}</span>
          )}
          <div className={`${baseClass}__values`}>
            {options.join(', ')}
            {remaining > 0 && (
              <span className={`${baseClass}__more`}>
                {i18n.t('fields:itemsAndMore', { count: remaining, items: '' }).trim()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
