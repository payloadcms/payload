'use client'

import * as qs from 'qs-esm'
import React, { useCallback } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { PopupList } from '../Popup/index.js'

export const PublishButton: React.FC<{ label?: string }> = ({ label: labelProp }) => {
  const {
    id,
    collectionSlug,
    docConfig,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    setHasPublishedDoc,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
  } = useDocumentInfo()

  const { config } = useConfig()
  const { submit } = useForm()
  const modified = useFormModified()
  const editDepth = useEditDepth()
  const { code: localeCode } = useLocale()

  const {
    localization,
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()
  const label = labelProp || t('version:publishChanges')

  const hasNewerVersions = unpublishedVersionCount > 0
  const canPublish = hasPublishPermission && (modified || hasNewerVersions || !hasPublishedDoc)
  const operation = useOperation()

  const forceDisable = operation === 'update' && !modified

  const saveDraft = useCallback(async () => {
    if (forceDisable) {
      return
    }

    const search = `?locale=${localeCode}&depth=0&fallback-locale=null&draft=true`
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
  }, [submit, collectionSlug, globalSlug, serverURL, api, localeCode, id, forceDisable])

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (saveDraft && docConfig.versions?.drafts && docConfig.versions?.drafts?.autosave) {
      void saveDraft()
    }
  })

  const publish = useCallback(() => {
    void submit({
      overrides: {
        _status: 'published',
      },
    })

    setUnpublishedVersionCount(0)
    setHasPublishedDoc(true)
  }, [setHasPublishedDoc, submit, setUnpublishedVersionCount])

  const publishSpecificLocale = useCallback(
    (locale) => {
      const params = qs.stringify({
        publishSpecificLocale: locale,
      })

      const action = `${serverURL}${api}${
        globalSlug ? `/globals/${globalSlug}` : `/${collectionSlug}/${id ? `${'/' + id}` : ''}`
      }${params ? '?' + params : ''}`

      void submit({
        action,
        overrides: {
          _status: 'published',
        },
      })

      setHasPublishedDoc(true)
    },
    [api, collectionSlug, globalSlug, id, serverURL, setHasPublishedDoc, submit],
  )

  if (!hasPublishPermission) {
    return null
  }

  return (
    <FormSubmit
      buttonId="action-save"
      disabled={!canPublish}
      onClick={publish}
      size="medium"
      SubMenuPopupContent={
        localization
          ? ({ close }) =>
              localization.locales.map((locale) => {
                const formattedLabel =
                  typeof locale.label === 'string'
                    ? locale.label
                    : locale.label && locale.label[i18n?.language]

                const isActive =
                  typeof locale === 'string' ? locale === localeCode : locale.code === localeCode

                if (isActive) {
                  return (
                    <PopupList.ButtonGroup key={locale.code}>
                      <PopupList.Button
                        onClick={() => [publishSpecificLocale(locale.code), close()]}
                      >
                        {t('version:publishIn', { locale: formattedLabel || locale.code })}
                      </PopupList.Button>
                    </PopupList.ButtonGroup>
                  )
                }
              })
          : undefined
      }
      type="button"
    >
      {label}
    </FormSubmit>
  )
}
