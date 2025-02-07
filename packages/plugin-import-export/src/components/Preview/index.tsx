'use client'
import type { Column } from '@payloadcms/ui'

import { Table, useConfig, useField } from '@payloadcms/ui'
import * as qs from 'qs-esm'
import React from 'react'

import { reduceFields } from '../FieldsToExport/reduceFields.js'
import { useImportExport } from '../ImportExportProvider/index.js'
import './index.scss'

const baseClass = 'Preview'

interface Field {
  label?: string
  value: {
    name: string
  }
}

export const Preview = () => {
  const { collection, columnsToExport } = useImportExport()
  const { config } = useConfig()
  const { value: whereIncoming } = useField({ path: 'where' })
  const [dataToRender, setDataToRender] = React.useState<any[]>([])
  const collectionSlug = typeof collection === 'string' && collection
  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )
  const reducedFields =
    collectionConfig && (reduceFields({ fields: collectionConfig.fields }) as any)

  // TODO: this might be causing the table issue, need to check if there is a reusable function anywhere to format columns
  const columns: Column[] =
    reducedFields &&
    reducedFields.map((field: Field) => {
      const fieldToExport = columnsToExport.find(
        (column) => typeof column !== 'string' && column.value === field.value.name,
      )
      if (fieldToExport) {
        return {
          accessor: field.value.name,
          active: true,
          field,
          Heading: field.label || field.value.name,
          renderedCells: [],
        }
      }
    })

  const whereQuery = qs.stringify(JSON.stringify(whereIncoming), { addQueryPrefix: true })

  React.useEffect(() => {
    const fetchData = async () => {
      if (!collectionSlug || !whereIncoming) {
        return
      }

      try {
        const response = await fetch(`/api/${collectionSlug}${whereQuery}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })

        if (response.ok) {
          const data = await response.json()
          // TODO: check if this data is in the correct format for the table
          setDataToRender(data.docs)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    void fetchData()
  }, [collectionSlug, whereIncoming])

  return (
    <div className={baseClass}>
      <h3>Preview</h3>
      <Table columns={columns} data={dataToRender} />
    </div>
  )
}
