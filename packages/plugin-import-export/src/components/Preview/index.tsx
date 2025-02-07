'use client'
import type { Column } from '@payloadcms/ui'

import { Table, useConfig, useSelection } from '@payloadcms/ui'

import './index.scss'

import React from 'react'

import { reduceFields } from '../FieldsToExport/reduceFields.js'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'Preview'

interface Field {
  label?: string
  value: {
    name: string
  }
}

export const Preview = () => {
  const { collection, columnsToExport, selected } = useImportExport()
  const { config } = useConfig()

  const collectionSlug = typeof collection === 'string' && collection
  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )
  const reducedFields =
    collectionConfig && (reduceFields({ fields: collectionConfig.fields }) as any)

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

  const dataToRender = {} as any
  return (
    <React.Fragment>
      <div className={baseClass}>
        <h3>Preview</h3>
        {/* <Table columns={columns} data={dataToRender} /> */}
      </div>
    </React.Fragment>
  )
}
