import React from 'react'

import type { Option, OptionObject } from 'payload/types'
import type { Props } from './types'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'
import FieldDescription from '../../FieldDescription'
import SelectInput from './Input'
import { SelectFieldWrapper } from './Wrapper'
import { withCondition } from '../../withCondition'

import './index.scss'

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
    i18n,
    value,
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <SelectFieldWrapper
      className={className}
      style={style}
      width={width}
      path={path}
      readOnly={readOnly}
    >
      <ErrorComp path={path} />
      <LabelComp
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
        i18n={i18n}
      />
      <SelectInput
        readOnly={readOnly}
        isClearable={isClearable}
        hasMany={hasMany}
        isSortable={isSortable}
        options={formatOptions(options)}
        path={path}
      />
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </SelectFieldWrapper>
  )
}

export default withCondition(Select)
