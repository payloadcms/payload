'use client'
import type {
  MappedComponent,
  OptionObject,
  SelectFieldClient,
  StaticDescription,
  StaticLabel,
} from 'payload'
import type { MarkOptional } from 'ts-essentials'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type SelectInputProps = {
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly Description?: MappedComponent
  readonly description?: StaticDescription
  readonly descriptionProps?: Record<string, unknown>
  readonly Error?: MappedComponent
  readonly errorProps?: Record<string, unknown>
  readonly field?: MarkOptional<SelectFieldClient, 'type'>
  readonly hasMany?: boolean
  readonly isClearable?: boolean
  readonly isSortable?: boolean
  readonly Label?: MappedComponent
  readonly label?: StaticLabel
  readonly labelProps?: Record<string, unknown>
  readonly name: string
  readonly onChange?: ReactSelectAdapterProps['onChange']
  readonly options?: OptionObject[]
  readonly path: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string | string[]
  readonly width?: React.CSSProperties['width']
}

export const SelectInput: React.FC<SelectInputProps> = (props) => {
  const {
    afterInput,
    beforeInput,
    className,
    Description,
    description,
    descriptionProps,
    Error,
    errorProps,
    field,
    hasMany = false,
    isClearable = true,
    isSortable = true,
    Label,
    label,
    labelProps,
    onChange,
    options,
    path,
    readOnly,
    required,
    showError,
    style,
    value,
    width,
  } = props

  const { i18n } = useTranslation()

  let valueToRender

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => {
      const matchingOption = options.find((option) => option.value === val)
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val,
      }
    })
  } else if (value) {
    const matchingOption = options.find((option) => option.value === value)
    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value,
    }
  }

  return (
    <div
      className={[
        fieldBaseClass,
        'select',
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        field={field}
        Label={Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={Error} field={field} path={path} {...(errorProps || {})} />
        <RenderComponent mappedComponent={beforeInput} />
        <ReactSelect
          disabled={readOnly}
          isClearable={isClearable}
          isMulti={hasMany}
          isSortable={isSortable}
          onChange={onChange}
          options={options.map((option) => ({
            ...option,
            label: getTranslation(option.label, i18n),
          }))}
          showError={showError}
          value={valueToRender as OptionObject}
        />
        <RenderComponent mappedComponent={afterInput} />
      </div>
      <FieldDescription
        Description={Description}
        description={description}
        field={field}
        {...(descriptionProps || {})}
      />
    </div>
  )
}
