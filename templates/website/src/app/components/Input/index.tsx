import type { FieldValues, UseFormRegister } from 'react-hook-form'

import React from 'react'

type Props = {
  disabled?: boolean
  error: any
  label: string
  name: string
  placeholder?: string
  register: UseFormRegister<FieldValues>
  required?: boolean
  type?: 'email' | 'number' | 'password' | 'text' | 'textarea'
  validate?: (value: string) => boolean | string
}

export const Input: React.FC<Props> = ({
  name,
  type = 'text',
  disabled,
  error,
  label,
  placeholder,
  register,
  required,
  validate,
}) => {
  return (
    <div className="classes.inputWrap">
      <label className="classes.label" htmlFor="name">
        {label}
        {required ? <span className="classes.asterisk">&nbsp;*</span> : ''}
      </label>
      {type === 'textarea' ? (
        <textarea
          className={['classes.input', 'classes.textarea', error && 'classes.error']
            .filter(Boolean)
            .join(' ')}
          placeholder={placeholder}
          rows={3}
          {...register(name, {
            required,
            validate,
          })}
          disabled={disabled}
        />
      ) : (
        <input
          className={['classes.input', error && 'casses.errolr'].filter(Boolean).join(' ')}
          placeholder={placeholder}
          type={type}
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
          disabled={disabled}
        />
      )}
      {error && (
        <div className="classes.errorMessage">
          {!error?.message && error?.type === 'required'
            ? 'This field is required'
            : error?.message}
        </div>
      )}
    </div>
  )
}
