'use client'
import type { MappedComponent, OptionObject, StaticDescription } from 'payload'

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
  readonly Description?: MappedComponent
  readonly Error?: MappedComponent
  readonly Label?: MappedComponent
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly description?: StaticDescription
  readonly descriptionProps?: Record<string, unknown>
  readonly errorProps?: Record<string, unknown>
  readonly hasMany?: boolean
  readonly isClearable?: boolean
  readonly isSortable?: boolean
  readonly label: string
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
  readonly width?: string
}

export const SelectInput: React.FC<SelectInputProps> = (props) => {
  const {
    Description,
    Error,
    Label,
    afterInput,
    beforeInput,
    className,
    description,
    descriptionProps,
    errorProps,
    hasMany = false,
    isClearable = true,
    isSortable = true,
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
      <FieldLabel Label={Label} label={label} required={required} {...(labelProps || {})} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={Error} path={path} {...(errorProps || {})} />
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
        {...(descriptionProps || {})}
      />
    </div>
  )
}
