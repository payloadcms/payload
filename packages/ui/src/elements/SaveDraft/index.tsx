'use client'
import type { CustomSaveDraftButtonProps, DefaultSaveDraftButtonProps } from 'payload/types'

import React, { useCallback, useRef } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useForm, useFormModified } from '../../forms/Form/context.js'
import FormSubmit from '../../forms/Submit/index.js'
import useHotkey from '../../hooks/useHotkey.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'save-draft'

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
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const { t } = useTranslation()

  const canSaveDraft = modified

  const saveDraft = useCallback(async () => {
    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`
    let action
    let method = 'POST'

    if (collectionSlug) {
      action = `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ''}${search}`
      if (id) method = 'PATCH'
    }

    if (globalSlug) {
      action = `${serverURL}${api}/globals/${globalSlug}${search}`
    }

    await submit({
      action,
      method,
      overrides: {
        _status: 'draft',
      },
      skipValidation: true,
    })
  }, [submit, collectionSlug, globalSlug, serverURL, api, locale, id])

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveDraftButton}
      componentProps={{
        DefaultButton: DefaultSaveDraftButton,
        disabled: !canSaveDraft,
        label: t('version:saveDraft'),
        saveDraft,
      }}
    />
  )
}
