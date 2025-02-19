'use client'

import type { OptionObject, SelectFieldClientComponent } from 'payload'

import { FieldLabel, ReactSelect, useConfig, useDocumentInfo, useField } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'
import { reduceFields } from './reduceFields.js'

const baseClass = 'fields-to-export'

export const FieldsToExport: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { path } = props
  const { setValue, value } = useField({ path })
  const { value: collectionValue } = useField({ path: 'collectionSlug' })
  const { getEntityConfig } = useConfig()
  const { collection, setColumnsToExport } = useImportExport()

  const collectionConfig = getEntityConfig({ collectionSlug: collectionValue ?? collection })

  const reducedFields = reduceFields({ fields: collectionConfig?.fields }) as any[]

  const fieldOptions = reducedFields.map((field) => {
    return {
      // TODO: the label should be used, for some reason on save there was a circular JSON error
      label: field.value.path,
      value: field.value.path,
    }
  })

  // TODO: this is causing the form to crash
  // set all fields to be selected by default
  // useEffect(() => {
  //   setValue(fieldOptions)
  //   setColumnsToExport(fieldOptions as any)
  // }, [fieldOptions, setColumnsToExport, setValue])

  const onChange = (value: any) => {
    setValue(value)
    setColumnsToExport(value)
  }

  // TODO: after save the form crashes, returning null to avoid errors when the id is present
  if (id) {
    return null
  }

  return (
    <React.Fragment>
      <FieldLabel label="Columns to Export" />
      <ReactSelect
        className={baseClass}
        disabled={props.readOnly}
        isClearable={true}
        isMulti={true}
        isSortable={true}
        onChange={onChange}
        options={fieldOptions}
        value={value as OptionObject}
      />
    </React.Fragment>
  )
}
