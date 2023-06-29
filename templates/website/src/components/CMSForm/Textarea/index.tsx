'use client'

import React from 'react'
import { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

import { Form } from '../../../payload-types'
import { Error } from '../Error'
import { Width } from '../Width'

import classes from './index.module.scss'

type TextAreaField = Extract<Form['fields'][0], { blockType: 'textarea' }>

export const Textarea: React.FC<
  TextAreaField & {
    register: UseFormRegister<FieldValues & any>
    rows?: number
    errors: Partial<
      FieldErrorsImpl<{
        [x: string]: any
      }>
    >
  }
> = ({ name, label, width, rows = 3, register, required: requiredFromProps, errors }) => {
  return (
    <Width width={width}>
      <div className={classes.wrap}>
        <label htmlFor="name" className={classes.label}>
          {label}
        </label>
        <textarea
          rows={rows}
          className={classes.textarea}
          {...register(name, { required: requiredFromProps })}
        />
        {requiredFromProps && errors[name] && <Error />}
      </div>
    </Width>
  )
}
