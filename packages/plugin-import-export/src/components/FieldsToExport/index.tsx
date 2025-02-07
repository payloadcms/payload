'use client'

import { ReactSelect, useConfig, useField } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'
import { reduceFields } from './reduceFields.js'

const baseClass = 'fields-to-export'

export const FieldsToExport: React.FC = () => {
  const { setValue, value } = useField({ path: 'fields' })
  const { getEntityConfig } = useConfig()
  const { collection } = useImportExport()
  const collectionConfig = getEntityConfig({ collectionSlug: collection })

  // const filteredFields = collectionConfig.fields.filter((field) => {
  //   return Array.isArray(value) && value.some((value) => field === value)
  // })

  useEffect(() => {
    console.log(value)
  }, [value])
  // get the collection from the url

  // set default fields from collection preferences

  // get the fields from the current collection

  console.log(collection, collectionConfig?.fields.length)

  return (
    <React.Fragment>
      <ReactSelect
        isClearable={true}
        isMulti={true}
        isSortable={true}
        onChange={(value) => setValue(value ?? null)}
        options={reduceFields({ fields: collectionConfig.fields })}
      />
    </React.Fragment>
  )
}
