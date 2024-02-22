import React, { forwardRef } from 'react'

import type { Props as ButtonProps } from '../../elements/Button/types'

import Button from '../../elements/Button'
import { useForm, useFormProcessing } from '../Form/context'
import './index.scss'

const baseClass = 'form-submit'

const FormSubmit = forwardRef<HTMLButtonElement, ButtonProps & { buttonId?: string }>(
  (props, ref) => {
    const { type = 'submit', buttonId: id, children, disabled: disabledFromProps } = props
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
  },
)

export default FormSubmit
