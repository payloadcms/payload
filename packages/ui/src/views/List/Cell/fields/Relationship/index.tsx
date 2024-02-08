'use client'
import React, { useEffect, useState } from 'react'
import { useTranslation } from '../../../../../providers/Translation'

import type { CellComponentProps, CellProps } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { useIntersect } from '../../../../../hooks/useIntersect'
import { formatDocTitle } from '../../../../../utilities/formatDocTitle'
import { useConfig } from '../../../../../providers/Config'
import { useListRelationships } from '../../../RelationshipProvider'
import './index.scss'

type Value = { relationTo: string; value: number | string }
const baseClass = 'relationship-cell'
const totalToShow = 3

export interface RelationshipCellProps extends CellComponentProps<any> {
  relationTo: CellProps['relationTo']
  label: CellProps['label']
}

export const RelationshipCell: React.FC<RelationshipCellProps> = ({
  cellData,
  relationTo,
  label,
}) => {
  const config = useConfig()
  const { collections, routes } = config
  const [intersectionRef, entry] = useIntersect()
  const [values, setValues] = useState<Value[]>([])
  const { documents, getRelationships } = useListRelationships()
  const [hasRequested, setHasRequested] = useState(false)
  const { i18n, t } = useTranslation()

  const isAboveViewport = entry?.boundingClientRect?.top < window.innerHeight

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
              relationTo: relationTo,
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
          useAsTitle: relatedCollection?.admin?.useAsTitle,
          doc: document === false ? null : document,
          i18n,
        })

        return (
          <React.Fragment key={i}>
            {document === false && `${t('general:untitled')} - ID: ${value}`}
            {document === null && `${t('general:loading')}...`}
            {document && (label || `${t('general:untitled')} - ID: ${value}`)}
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
