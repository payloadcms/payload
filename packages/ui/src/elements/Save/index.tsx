'use client'
import type { CustomSaveButtonProps, DefaultSaveButtonProps } from 'payload/types'

import React, { useRef } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useForm } from '../../forms/Form/context.js'
import FormSubmit from '../../forms/Submit/index.js'
import useHotkey from '../../hooks/useHotkey.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const DefaultSaveButton: React.FC<DefaultSaveButtonProps> = ({ label, save }) => {
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
    <FormSubmit buttonId="action-save" onClick={save} ref={ref} size="small" type="button">
      {label}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: CustomSaveButtonProps
}

export const Save: React.FC<Props> = ({ CustomComponent }) => {
  const { t } = useTranslation()
  const { submit } = useForm()

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveButton}
      componentProps={{
        DefaultButton: DefaultSaveButton,
        label: t('general:save'),
        save: submit,
      }}
    />
  )
}
