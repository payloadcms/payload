'use client'

import type { SaveDraftButtonClientProps } from 'payload'

import React, { useCallback, useRef } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'save-draft'

export function SaveDraftButton(props: SaveDraftButtonClientProps) {
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { id, collectionSlug, globalSlug, setUnpublishedVersionCount, uploadStatus } =
    useDocumentInfo()

  const modified = useFormModified()
  const { code: locale } = useLocale()
  const ref = useRef<HTMLButtonElement>(null)
  const editDepth = useEditDepth()
  const { t } = useTranslation()
  const { submit } = useForm()
  const operation = useOperation()

  const disabled = (operation === 'update' && !modified) || uploadStatus === 'uploading'

  const saveDraft = useCallback(async () => {
    if (disabled) {
      return
    }

    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`
    let action
    let method = 'POST'

    if (collectionSlug) {
      action = `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ''}${search}`
      if (id) {
        method = 'PATCH'
      }
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

    setUnpublishedVersionCount((count) => count + 1)
  }, [
    submit,
    collectionSlug,
    globalSlug,
    serverURL,
    api,
    locale,
    id,
    disabled,
    setUnpublishedVersionCount,
  ])

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    if (disabled) {
      // absorb the event
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
      onClick={() => {
        return void saveDraft()
      }}
      ref={ref}
      size="medium"
      type="button"
    >
      {t('version:saveDraft')}
    </FormSubmit>
  )
}
