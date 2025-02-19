'use client'
import type { OptionObject, SelectFieldClientComponent } from 'payload'

import { FieldLabel, ReactSelect, useConfig, useDocumentInfo, useField } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { reduceFields } from '../FieldsToExport/reduceFields.js'
import { useImportExport } from '../ImportExportProvider/index.js'
import './index.scss'

const baseClass = 'sort-by-fields'

export const SortByFields: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { setValue, value } = useField({ path: 'sort' })
  const { value: collectionValue } = useField({ path: 'collectionSlug' })
  const { getEntityConfig } = useConfig()
  const { collection } = useImportExport()
  const collectionConfig = getEntityConfig({ collectionSlug: collectionValue ?? collection })

  const fieldOptions = reduceFields({ fields: collectionConfig?.fields }) as any[]

  const options = fieldOptions.map((field) => {
    return {
      // TODO: the label should be used, for some reason on save there was a circular JSON error
      label: field.value.path,
      value: field.value.path,
    }
  })

  // TODO: this is causing the form to crash
  // useEffect(() => {
  //   if (options && options[0] && options[0].value !== value) {
  //     setValue(options[0])
  //   }
  // }, [options, setValue, value])

  // TODO: after save the form crashes, returning null to avoid errors when the id is present
  if (id) {
    return null
  }

  return (
    <div className={baseClass} style={{ '--field-width': '33%' } as React.CSSProperties}>
      <FieldLabel label="Sort By" />
      <ReactSelect
        disabled={props.readOnly}
        isClearable={true}
        isMulti={false}
        onChange={(value) => setValue(value ?? null)}
        options={options}
        value={value as OptionObject}
      />
    </div>
  )
}
