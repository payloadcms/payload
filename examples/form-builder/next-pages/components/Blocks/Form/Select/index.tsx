import React from 'react'
import ReactSelect from 'react-select'
import { SelectField } from 'payload-plugin-form-builder/dist/types'
import { Controller, Control, FieldValues, FieldErrorsImpl } from 'react-hook-form'
import { Error } from '../Error'
import { Width } from '../Width'

import classes from './index.module.scss'

export const Select: React.FC<
  SelectField & {
    control: Control<FieldValues, any>
    errors: Partial<
      FieldErrorsImpl<{
        [x: string]: any
      }>
    >
  }
> = ({ name, label, width, options, control, required, errors }) => {
  return (
    <Width width={width}>
      <div className={classes.select}>
        <label htmlFor={name} className={classes.label}>
          {label}
        </label>
        <Controller
          control={control}
          rules={{ required }}
          name={name}
          defaultValue=""
          render={({ field: { onChange, value } }) => (
            <ReactSelect
              instanceId={name}
              options={options}
              value={options.find(s => s.value === value)}
              onChange={val => onChange(val.value)}
              className={classes.reactSelect}
              classNamePrefix="rs"
              inputId={name}
            />
          )}
        />
        {required && errors[name] && <Error />}
      </div>
    </Width>
  )
}
