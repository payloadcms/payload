import React from 'react'
import { FieldValues, UseFormRegister } from 'react-hook-form'

import classes from './index.module.css'

type Props = {
  name: string
  label: string
  register: UseFormRegister<FieldValues & any>
  required?: boolean
  error: any
  type?: 'text' | 'number' | 'password'
}

export const Input: React.FC<Props> = ({
  name,
  label,
  required,
  register,
  error,
  type = 'text',
}) => {
  return (
    <div className={classes.input}>
      <label htmlFor="name" className={classes.label}>
        {label}
      </label>
      <input {...{ type }} {...register(name, { required })} />
      {error && <div className={classes.error}>This field is required</div>}
    </div>
  )
}
