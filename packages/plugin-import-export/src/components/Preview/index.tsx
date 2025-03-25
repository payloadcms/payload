'use client'
import type { Column } from '@payloadcms/ui'
import type { ClientField, FieldAffectingDataClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Table, useConfig, useField, useTranslation } from '@payloadcms/ui'
import { fieldAffectsData } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'
import './index.scss'

const baseClass = 'preview'

export const Preview = () => {
  const { collection } = useImportExport()
  const { config } = useConfig()
  const { value: where } = useField({ path: 'where' })
  const { value: limit } = useField<number>({ path: 'limit' })
  const { value: fields } = useField<string[]>({ path: 'fields' })
  const { value: sort } = useField({ path: 'sort' })
  const { value: draft } = useField({ path: 'draft' })
  const [dataToRender, setDataToRender] = React.useState<any[]>([])
  const [resultCount, setResultCount] = React.useState<any>('')
  const [columns, setColumns] = React.useState<Column[]>([])
  const { i18n } = useTranslation()

  const collectionSlug = typeof collection === 'string' && collection
  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  React.useEffect(() => {
    const fetchData = async () => {
      if (!collectionSlug) {
        return
      }

      try {
        const whereQuery = qs.stringify(
          {
            depth: 0,
            draft,
            limit: limit > 10 ? 10 : limit,
            sort,
            where,
          },
          {
            addQueryPrefix: true,
          },
        )
        const response = await fetch(`/api/${collectionSlug}${whereQuery}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })

        if (response.ok) {
          const data = await response.json()
          setResultCount(limit && limit < data.totalDocs ? limit : data.totalDocs)
          // TODO: check if this data is in the correct format for the table

          const filteredFields = (collectionConfig?.fields?.filter((field) => {
            if (!fieldAffectsData(field)) {
              return false
            }
            if (fields?.length > 0) {
              return fields.includes(field.name)
            }
            return true
          }) ?? []) as FieldAffectingDataClient[]

          setColumns(
            filteredFields.map((field) => ({
              accessor: field.name || '',
              active: true,
              field: field as ClientField,
              Heading: getTranslation(field?.label || (field.name as string), i18n),
              renderedCells: data.docs.map((doc: Record<string, unknown>) => {
                if (!field.name || !doc[field.name]) {
                  return null
                }
                if (typeof doc[field.name] === 'object') {
                  return JSON.stringify(doc[field.name])
                }
                return String(doc[field.name])
              }),
            })) as Column[],
          )
          setDataToRender(data.docs)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    void fetchData()
  }, [collectionConfig?.fields, collectionSlug, draft, fields, limit, sort, where])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h3>Preview</h3>
        {resultCount && <span>{resultCount} total documents</span>}
      </div>
      {dataToRender && <Table columns={columns} data={dataToRender} />}
    </div>
  )
}
