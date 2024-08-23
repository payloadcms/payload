'use client'

import type { UploadFieldProps } from 'payload'

import React from 'react'

import type { useField } from '../../../forms/useField/index.js'

import { useConfig } from '../../../providers/Config/index.js'
import { UploadInputHasOne } from './Input.js'
import './index.scss'

export type UploadFieldPropsWithContext<TValue extends string | string[] = string> = {
  readonly canCreate: boolean
  readonly disabled: boolean
  readonly fieldHookResult: ReturnType<typeof useField<TValue>>
  readonly onChange: (value: unknown) => void
} & UploadFieldProps

export const UploadComponentHasOne: React.FC<UploadFieldPropsWithContext> = (props) => {
  const {
    canCreate,
    descriptionProps,
    disabled,
    errorProps,
    field,
    field: { admin: { className, style, width } = {}, label, relationTo, required },
    fieldHookResult,
    labelProps,
    onChange,
  } = props

  const {
    config: {
      collections,
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()

  if (typeof relationTo === 'string') {
    const collection = collections.find((coll) => coll.slug === relationTo)

    if (collection.upload) {
      return (
        <UploadInputHasOne
          Description={field?.admin?.components?.Description}
          Error={field?.admin?.components?.Error}
          Label={field?.admin?.components?.Label}
          allowNewUpload={canCreate}
          api={apiRoute}
          className={className}
          collection={collection}
          descriptionProps={descriptionProps}
          errorProps={errorProps}
          filterOptions={fieldHookResult.filterOptions}
          label={label}
          labelProps={labelProps}
          onChange={onChange}
          readOnly={disabled}
          relationTo={relationTo}
          required={required}
          serverURL={serverURL}
          showError={fieldHookResult.showError}
          style={style}
          value={fieldHookResult.value}
          width={width}
        />
      )
    }
  } else {
    return <div>Polymorphic Has One Uploads Go Here</div>
  }

  return null
}
