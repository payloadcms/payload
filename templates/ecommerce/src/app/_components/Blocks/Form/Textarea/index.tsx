import React from 'react'
import { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'
import { TextField } from '@payloadcms/plugin-form-builder/dist/types'

import { Error } from '../Error'
import { Width } from '../Width'

import classes from './index.module.scss'

export const Textarea: React.FC<
  TextField & {
    register: UseFormRegister<FieldValues & any>
    defaultValue?: string
    rows?: number
    errors: Partial<
      FieldErrorsImpl<{
        [x: string]: any
      }>
    >
  }
> = ({
  name,
  label,
  width,
  defaultValue = '',
  rows = 3,
  register,
  required: requiredFromProps,
  errors,
}) => {
    return (
      <Width width={width}>
        <div className={classes.wrap}>
          <label htmlFor={name} className={classes.label}>
            {label}
          </label>
          <textarea
            rows={rows}
            className={classes.textarea}
            defaultValue={defaultValue}
            id={name}
            {...register(name, { required: requiredFromProps })}
          />
          {requiredFromProps && errors[name] && <Error />}
        </div>
      </Width>
    )
  }
