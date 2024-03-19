'use client'
import type { CellComponentProps, CellProps } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { useIntersect } from '@payloadcms/ui/hooks/useIntersect'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { canUseDOM } from '@payloadcms/ui/utilities/canUseDOM'
import { formatDocTitle } from '@payloadcms/ui/utilities/formatDocTitle'
import React, { useEffect, useState } from 'react'

import { useListRelationships } from '../../../RelationshipProvider/index.js'
import './index.scss'

type Value = { relationTo: string; value: number | string }
const baseClass = 'relationship-cell'
const totalToShow = 3

export interface RelationshipCellProps extends CellComponentProps<any> {
  label: CellProps['label']
  relationTo: CellProps['relationTo']
}

export const RelationshipCell: React.FC<RelationshipCellProps> = ({
  cellData,
  label,
  relationTo,
}) => {
  const config = useConfig()
  const { collections, routes } = config
  const [intersectionRef, entry] = useIntersect()
  const [values, setValues] = useState<Value[]>([])
  const { documents, getRelationships } = useListRelationships()
  const [hasRequested, setHasRequested] = useState(false)
  const { i18n, t } = useTranslation()

  const isAboveViewport = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false

  useEffect(() => {
    if (cellData && isAboveViewport && !hasRequested) {
      const formattedValues: Value[] = []

      const arrayCellData = Array.isArray(cellData) ? cellData : [cellData]
      arrayCellData
        .slice(0, arrayCellData.length < totalToShow ? arrayCellData.length : totalToShow)
        .forEach((cell) => {
          if (typeof cell === 'object' && 'relationTo' in cell && 'value' in cell) {
            formattedValues.push(cell)
          }
          if (
            (typeof cell === 'number' || typeof cell === 'string') &&
            typeof relationTo === 'string'
          ) {
            formattedValues.push({
              relationTo,
              value: cell,
            })
          }
        })
      getRelationships(formattedValues)
      setHasRequested(true)
      setValues(formattedValues)
    }
  }, [
    cellData,
    relationTo,
    collections,
    isAboveViewport,
    routes.api,
    hasRequested,
    getRelationships,
  ])

  return (
    <div className={baseClass} ref={intersectionRef}>
      {values.map(({ relationTo, value }, i) => {
        const document = documents[relationTo][value]
        const relatedCollection = collections.find(({ slug }) => slug === relationTo)

        const label = formatDocTitle({
          collectionConfig: relatedCollection,
          data: document || null,
          dateFormat: config.admin.dateFormat,
          fallback: `${t('general:untitled')} - ID: ${value}`,
          i18n,
        })

        return (
          <React.Fragment key={i}>
            {document === false && `${t('general:untitled')} - ID: ${value}`}
            {document === null && `${t('general:loading')}...`}
            {document ? label : null}
            {values.length > i + 1 && ', '}
          </React.Fragment>
        )
      })}
      {Array.isArray(cellData) &&
        cellData.length > totalToShow &&
        t('fields:itemsAndMore', { count: cellData.length - totalToShow, items: '' })}
      {values.length === 0 && t('general:noLabel', { label: getTranslation(label || '', i18n) })}
    </div>
  )
}
