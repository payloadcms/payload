import React from 'react'
import { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'
import { EmailField } from '@payloadcms/plugin-form-builder/dist/types'

import { Error } from '../Error'
import { Width } from '../Width'

import classes from './index.module.scss'

export const Email: React.FC<
  EmailField & {
    register: UseFormRegister<FieldValues & any>
    errors: Partial<
      FieldErrorsImpl<{
        [x: string]: any
      }>
    >
  }
> = ({ name, width, label, register, required: requiredFromProps, errors }) => {
  return (
    <Width width={width}>
      <div className={classes.wrap}>
        <label htmlFor={name} className={classes.label}>
          {label}
        </label>
        <input
          type="text"
          placeholder="Email"
          className={classes.input}
          id={name}
          {...register(name, { required: requiredFromProps, pattern: /^\S+@\S+$/i })}
        />
        {requiredFromProps && errors[name] && <Error />}
      </div>
    </Width>
  )
}
