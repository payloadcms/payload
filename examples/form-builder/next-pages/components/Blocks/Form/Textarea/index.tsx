import React from 'react'
import { TextField } from 'payload-plugin-form-builder/dist/types'
import { UseFormRegister, FieldValues, FieldErrorsImpl } from 'react-hook-form'
import { Error } from '../Error'
import { Width } from '../Width'

import classes from './index.module.scss'

export const Textarea = ({
  name,
  label,
  width,
  rows = 3,
  register,
  required: requiredFromProps,
  errors,
}: TextField & {
  register: UseFormRegister<FieldValues & any>
  rows?: number
  errors: Partial<
    FieldErrorsImpl<{
      [x: string]: any
    }>
  >
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
          id={name}
          {...register(name, { required: requiredFromProps })}
        />
        {requiredFromProps && errors[name] && <Error />}
      </div>
    </Width>
  )
}
