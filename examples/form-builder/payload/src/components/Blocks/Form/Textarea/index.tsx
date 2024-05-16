import type { TextField } from 'payload-plugin-form-builder/dist/types'
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

import React from 'react'

import { Error } from '../Error'
import { Width } from '../Width'
import classes from './index.module.scss'

export const Textarea: React.FC<
  TextField & {
    errors: Partial<
      FieldErrorsImpl<{
        [x: string]: any
      }>
    >
    register: UseFormRegister<FieldValues & any>
    rows?: number
  }
> = ({ name, errors, label, register, required: requiredFromProps, rows = 3, width }) => {
  return (
    <Width width={width}>
      <div className={classes.wrap}>
        <label className={classes.label} htmlFor={name}>
          {label}
        </label>
        <textarea
          className={classes.textarea}
          id={name}
          rows={rows}
          {...register(name, { required: requiredFromProps })}
        />
        {requiredFromProps && errors[name] && <Error />}
      </div>
    </Width>
  )
}
