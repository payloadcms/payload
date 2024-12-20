'use client'

import React, { useRef } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadStatus } from '../../providers/UploadStatus/index.js'

export const SaveButton: React.FC<{ label?: string }> = ({ label: labelProp }) => {
  const { t } = useTranslation()
  const { submit } = useForm()
  const modified = useFormModified()
  const label = labelProp || t('general:save')
  const ref = useRef<HTMLButtonElement>(null)
  const editDepth = useEditDepth()
  const operation = useOperation()
  const { uploadStatus } = useUploadStatus()

  const forceDisable = operation === 'update' && !modified

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    if (forceDisable) {
      // absorb the event
    }

    e.preventDefault()
    e.stopPropagation()
    if (ref?.current) {
      ref.current.click()
    }
  })

  const handleSubmit = () => {
    if (uploadStatus === 'uploading') {
      return
    }

    return void submit()
  }

  return (
    <FormSubmit
      buttonId="action-save"
      disabled={forceDisable || uploadStatus === 'uploading'}
      onClick={handleSubmit}
      ref={ref}
      size="medium"
      type="button"
    >
      {label}
    </FormSubmit>
  )
}
