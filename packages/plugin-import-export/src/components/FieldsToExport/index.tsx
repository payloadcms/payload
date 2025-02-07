'use client'

import type { OptionObject } from 'payload'

import { FieldLabel, ReactSelect, useConfig, useField } from '@payloadcms/ui'
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

  const reducedFields = reduceFields({ fields: collectionConfig.fields }) as any[]

  const fieldOptions = reducedFields.map((field) => {
    return {
      label: field.label,
      value: field.value.path,
    }
  })

  // set all fields to be selected by default
  useEffect(() => {
    setValue(fieldOptions)
  }, [])

  return (
    <React.Fragment>
      <FieldLabel label="Columns to Export" />
      <ReactSelect
        isClearable={true}
        isMulti={true}
        isSortable={true}
        onChange={(value) => setValue(value ?? null)}
        options={fieldOptions}
        value={value as OptionObject}
      />
    </React.Fragment>
  )
}
