import type { SelectField } from 'payload-plugin-form-builder/dist/types'
import type { Control, FieldErrorsImpl, FieldValues } from 'react-hook-form';

import React from 'react'
import { Controller } from 'react-hook-form'
import ReactSelect from 'react-select'

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
> = ({ name, control, errors, label, options, required, width }) => {
  return (
    <Width width={width}>
      <div className={classes.select}>
        <label className={classes.label} htmlFor={name}>
          {label}
        </label>
        <Controller
          control={control}
          defaultValue=""
          name={name}
          render={({ field: { onChange, value } }) => (
            <ReactSelect
              className={classes.reactSelect}
              classNamePrefix="rs"
              inputId={name}
              instanceId={name}
              onChange={(val) => onChange(val.value)}
              options={options}
              value={options.find((s) => s.value === value)}
            />
          )}
          rules={{ required }}
        />
        {required && errors[name] && <Error />}
      </div>
    </Width>
  )
}
