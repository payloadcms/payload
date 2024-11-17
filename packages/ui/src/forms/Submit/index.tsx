'use client'
import React, { forwardRef } from 'react'

import type { Props } from '../../elements/Button/types.js'

import { Button } from '../../elements/Button/index.js'
import { useForm, useFormInitializing, useFormProcessing } from '../Form/context.js'
import './index.scss'

const baseClass = 'form-submit'

export const FormSubmit = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const { type = 'submit', buttonId: id, children, disabled: disabledFromProps, onClick } = props
  const processing = useFormProcessing()
  const initializing = useFormInitializing()
  const { disabled, submit } = useForm()

  const canSave = !(disabledFromProps || initializing || processing || disabled)

  return (
    <div className={baseClass}>
      <Button
        ref={ref}
        {...props}
        disabled={canSave ? undefined : true}
        id={id}
        onClick={
          onClick ??
          (() => {
            void submit()
          })
        }
        type={type}
      >
        {children}
      </Button>
    </div>
  )
})
