'use client'

import React, { useRef } from 'react'

import { useForm } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const DefaultSaveButton: React.FC = () => {
  const { t } = useTranslation()
  const { submit } = useForm()
  const label = t('general:save')
  const ref = useRef<HTMLButtonElement>(null)
  const editDepth = useEditDepth()

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (ref?.current) {
      ref.current.click()
    }
  })

  return (
    <FormSubmit
      buttonId="action-save"
      onClick={() => submit()}
      ref={ref}
      size="small"
      type="button"
    >
      {label}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: React.ReactNode
}

export const Save: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) return CustomComponent

  return <DefaultSaveButton />
}
