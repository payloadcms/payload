import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import useHotkey from '../../../hooks/useHotkey.js'
import { useForm, useFormModified } from '../../forms/Form/context.js'
import FormSubmit from '../../forms/Submit/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import { useDocumentInfo } from '../../utilities/DocumentInfo/index.js'
import { useEditDepth } from '../../utilities/EditDepth/index.js'
import { useLocale } from '../../utilities/Locale/index.js'
import RenderCustomComponent from '../../utilities/RenderCustomComponent/index.js'

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
      buttonStyle="secondary"
      className={baseClass}
      disabled={disabled}
      onClick={saveDraft}
      ref={ref}
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
  const { collection, global, id } = useDocumentInfo()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const { t } = useTranslation('version')

  const canSaveDraft = modified

  const saveDraft = useCallback(() => {
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

    submit({
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
      componentProps={{
        DefaultButton: DefaultSaveDraftButton,
        disabled: !canSaveDraft,
        label: t('saveDraft'),
        saveDraft,
      }}
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveDraftButton}
    />
  )
}
