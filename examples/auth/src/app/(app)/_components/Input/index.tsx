import type { FieldValues, UseFormRegister } from 'react-hook-form'

import React from 'react'

import classes from './index.module.scss'

type Props = {
  error: any
  label: string
  name: string
  register: UseFormRegister<any & FieldValues> // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
  required?: boolean
  type?: 'email' | 'number' | 'password' | 'text'
  validate?: (value: string) => boolean | string
}

export const Input: React.FC<Props> = ({
  name,
  type = 'text',
  error,
  label,
  register,
  required,
  validate,
}) => {
  return (
    <div className={classes.inputWrap}>
      <label className={classes.label} htmlFor="name">
        {`${label} ${required ? '*' : ''}`}
      </label>
      <input
        className={[classes.input, error && classes.error].filter(Boolean).join(' ')}
        {...{ type }}
        {...register(name, {
          required,
          validate,
          ...(type === 'email'
            ? {
                pattern: {
                  message: 'Please enter a valid email',
                  value: /\S[^\s@]*@\S+\.\S+/,
                },
              }
            : {}),
        })}
      />
      {error && (
        <div className={classes.errorMessage}>
          {!error?.message && error?.type === 'required'
            ? 'This field is required'
            : error?.message}
        </div>
      )}
    </div>
  )
}
