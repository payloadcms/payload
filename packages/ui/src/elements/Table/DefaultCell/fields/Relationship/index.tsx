'use client'
import type { DefaultCellComponentProps, RelationshipFieldClient, UploadFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useEffect, useState } from 'react'

import { useIntersect } from '../../../../../hooks/useIntersect.js'
import { useConfig } from '../../../../../providers/Config/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import { canUseDOM } from '../../../../../utilities/canUseDOM.js'
import { formatDocTitle } from '../../../../../utilities/formatDocTitle.js'
import { useListRelationships } from '../../../RelationshipProvider/index.js'
import { FileCell } from '../File/index.js'
import './index.scss'

type Value = { relationTo: string; value: number | string }
const baseClass = 'relationship-cell'
const totalToShow = 3

export interface RelationshipCellProps
  extends DefaultCellComponentProps<any, RelationshipFieldClient | UploadFieldClient> {}

export const RelationshipCell: React.FC<RelationshipCellProps> = ({
  cellData,
  customCellContext,
  field,
  field: { label, relationTo },
}) => {
  const { config } = useConfig()
  const { collections, routes } = config
  const [intersectionRef, entry] = useIntersect()
  const [values, setValues] = useState<Value[]>([])
  const { documents, getRelationships } = useListRelationships()
  const [hasRequested, setHasRequested] = useState(false)
  const { i18n, t } = useTranslation()

  const isAboveViewport = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false

  useEffect(() => {
    if ((cellData || typeof cellData === 'number') && isAboveViewport && !hasRequested) {
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

  useEffect(() => {
    if (hasRequested) {
      setHasRequested(false)
    }
  }, [cellData])

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

        let fileField = null

        if (field.type === 'upload') {
          const relatedCollectionPreview = !!relatedCollection.upload.displayPreview
          const previewAllowed =
            field.displayPreview || (relatedCollectionPreview && field.displayPreview !== false)

          if (previewAllowed && document) {
            fileField = (
              <FileCell
                cellData={label}
                customCellContext={customCellContext}
                field={field}
                rowData={document}
              />
            )
          }
        }

        return (
          <React.Fragment key={i}>
            {document === false && `${t('general:untitled')} - ID: ${value}`}
            {document === null && `${t('general:loading')}...`}
            {document ? fileField || label : null}
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
