import React, { forwardRef } from 'react'

import type { Props } from '../../elements/Button/types'

import Button from '../../elements/Button'
import { useForm, useFormProcessing } from '../Form/context'
import './index.scss'

const baseClass = 'form-submit'

const FormSubmit = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const { buttonId: id, children, disabled: disabledFromProps, type = 'submit' } = props
  const processing = useFormProcessing()
  const { disabled } = useForm()
  const canSave = !(disabledFromProps || processing || disabled)

  return (
    <div className={baseClass}>
      <Button ref={ref} {...props} disabled={canSave ? undefined : true} id={id} type={type}>
        {children}
      </Button>
    </div>
  )
})

export default FormSubmit
