'use client'
import React from 'react'

import type { Props } from '../../elements/Button/types.js'

import { Button } from '../../elements/Button/index.js'
import {
  useForm,
  useFormBackgroundProcessing,
  useFormInitializing,
  useFormProcessing,
} from '../Form/context.js'
import './index.scss'

const baseClass = 'form-submit'

export const FormSubmit: React.FC<Props> = (props) => {
  const { type = 'submit', buttonId: id, children, disabled: disabledFromProps, onClick } = props

  const processing = useFormProcessing()
  const backgroundProcessing = useFormBackgroundProcessing()
  const initializing = useFormInitializing()
  const { disabled } = useForm()

  const canSave = !(
    disabledFromProps ||
    initializing ||
    processing ||
    backgroundProcessing ||
    disabled
  )

  return (
    <div className={baseClass}>
      <Button
        {...props}
        disabled={canSave ? undefined : true}
        id={id}
        onClick={onClick}
        type={type}
      >
        {children}
      </Button>
    </div>
  )
}
