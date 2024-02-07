import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { RelationshipField, UploadField } from '../../../../../../../../exports/types'
import type { CellComponentProps } from '../../types'

import { getTranslation } from '../../../../../../../../utilities/getTranslation'
import useIntersect from '../../../../../../../hooks/useIntersect'
import { formatUseAsTitle } from '../../../../../../../hooks/useTitle'
import { useConfig } from '../../../../../../utilities/Config'
import { useListRelationships } from '../../../RelationshipProvider'
import File from '../File'
import './index.scss'

type Value = { relationTo: string; value: number | string }
const baseClass = 'relationship-cell'
const totalToShow = 3

const RelationshipCell: React.FC<CellComponentProps<RelationshipField>> = (props) => {
  const { data: cellData, field } = props
  const config = useConfig()
  const { collections, routes } = config
  const [intersectionRef, entry] = useIntersect()
  const [values, setValues] = useState<Value[]>([])
  const { documents, getRelationships } = useListRelationships()
  const [hasRequested, setHasRequested] = useState(false)
  const { i18n, t } = useTranslation('general')

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
            'relationTo' in field &&
            typeof field.relationTo === 'string'
          ) {
            formattedValues.push({
              relationTo: field.relationTo,
              value: cell,
            })
          }
        })
      getRelationships(formattedValues)
      setHasRequested(true)
      setValues(formattedValues)
    }
  }, [cellData, field, collections, isAboveViewport, routes.api, hasRequested, getRelationships])

  return (
    <div className={baseClass} ref={intersectionRef}>
      {values.map(({ relationTo, value }, i) => {
        const document = documents[relationTo][value]
        const relatedCollection = collections.find(({ slug }) => slug === relationTo)

        const label = formatUseAsTitle({
          collection: relatedCollection,
          config,
          doc: document === false ? null : document,
          i18n,
        })

        let fileField = null
        if ((field as unknown as UploadField).type === 'upload' && document) {
          fileField = (
            <File collection={relatedCollection} data={label} field={field} rowData={document} />
          )
        }

        return (
          <React.Fragment key={i}>
            {document === false && `${t('untitled')} - ID: ${value}`}
            {document === null && `${t('loading')}...`}
            {document && (fileField || label || `${t('untitled')} - ID: ${value}`)}
            {values.length > i + 1 && ', '}
          </React.Fragment>
        )
      })}
      {Array.isArray(cellData) &&
        cellData.length > totalToShow &&
        t('fields:itemsAndMore', { count: cellData.length - totalToShow, items: '' })}
      {values.length === 0 && t('noLabel', { label: getTranslation(field?.label || '', i18n) })}
    </div>
  )
}

export default RelationshipCell
