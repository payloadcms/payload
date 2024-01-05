import React from 'react'

import type { Option, OptionObject } from 'payload/types'
import type { Props } from './types'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'
import FieldDescription from '../../FieldDescription'
import SelectInput from './Input'
import { fieldBaseClass } from '../shared'

const formatOptions = (options: Option[]): OptionObject[] =>
  options.map((option) => {
    if (typeof option === 'object' && (option.value || option.value === '')) {
      return option
    }

    return {
      label: option,
      value: option,
    } as OptionObject
  })

export const Select: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      // condition,
      description,
      isClearable,
      isSortable = true,
      readOnly,
      style,
      width,
      components: { Error, Label } = {},
    } = {},
    hasMany,
    label,
    options,
    path: pathFromProps,
    required,
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[
        fieldBaseClass,
        'select',
        className,
        // showError && 'error',
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
      <ErrorComp
      // message={errorMessage}
      // showError={showError}
      />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <SelectInput
        readOnly={readOnly}
        isClearable={isClearable}
        hasMany={hasMany}
        isSortable={isSortable}
        options={formatOptions(options)}
        path={path}
      />
      <FieldDescription
        description={description}
        path={path}
        // value={value}
      />
    </div>
  )
}

export default Select
