'use client'
import React, { useRef } from 'react'
import { useTranslation } from '../../providers/Translation'

import useHotkey from '../../hooks/useHotkey'
import { useForm } from '../../forms/Form/context'
import FormSubmit from '../../forms/Submit'
import { useEditDepth } from '../../providers/EditDepth'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import { CustomSaveButtonProps, DefaultSaveButtonProps } from 'payload/types'

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
    <FormSubmit buttonId="action-save" onClick={save} ref={ref} type="button" size="small">
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
