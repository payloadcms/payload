import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import useHotkey from '../../hooks/useHotkey'
import { useForm, useFormModified } from '../../forms/Form/context'
import FormSubmit from '../../forms/Submit'
import { useConfig } from '../../providers/Config'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { useEditDepth } from '../../providers/EditDepth'
import { useLocale } from '../../providers/Locale'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'

const baseClass = 'save-draft'

export type CustomSaveDraftButtonProps = React.ComponentType<
  DefaultSaveDraftButtonProps & {
    DefaultButton: React.ComponentType<DefaultSaveDraftButtonProps>
  }
>
export type DefaultSaveDraftButtonProps = {
  disabled: boolean
  label: string
  saveDraft: () => void
}
const DefaultSaveDraftButton: React.FC<DefaultSaveDraftButtonProps> = ({
  disabled,
  label,
  saveDraft,
}) => {
  const ref = useRef<HTMLButtonElement>(null)
  const editDepth = useEditDepth()

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    if (disabled) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    if (ref?.current) {
      ref.current.click()
    }
  })

  return (
    <FormSubmit
      buttonId="action-save-draft"
      buttonStyle="secondary"
      className={baseClass}
      disabled={disabled}
      onClick={saveDraft}
      ref={ref}
      size="small"
      type="button"
    >
      {label}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: CustomSaveDraftButtonProps
}
export const SaveDraft: React.FC<Props> = ({ CustomComponent }) => {
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { submit } = useForm()
  const { id, collection, global } = useDocumentInfo()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const { t } = useTranslation('version')

  const canSaveDraft = modified

  const saveDraft = useCallback(async () => {
    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`
    let action
    let method = 'POST'

    if (collection) {
      action = `${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}${search}`
      if (id) method = 'PATCH'
    }

    if (global) {
      action = `${serverURL}${api}/globals/${global.slug}${search}`
    }

    await submit({
      action,
      method,
      overrides: {
        _status: 'draft',
      },
      skipValidation: true,
    })
  }, [submit, collection, global, serverURL, api, locale, id])

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveDraftButton}
      componentProps={{
        DefaultButton: DefaultSaveDraftButton,
        disabled: !canSaveDraft,
        label: t('saveDraft'),
        saveDraft,
      }}
    />
  )
}
