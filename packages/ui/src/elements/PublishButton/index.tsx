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

  const { t } = useTranslation()
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

  const publishAll =
    localization && localization.defaultLocalePublishOption !== 'active' ? true : false

  const activeLocale =
    localization &&
    localization?.locales.find((locale) =>
      typeof locale === 'string' ? locale === localeCode : locale.code === localeCode,
    )

  const activeLocaleLabel =
    typeof activeLocale.label === 'string'
      ? activeLocale.label
      : (activeLocale.label?.[localeCode] ?? undefined)

  const defaultPublish = publishAll ? publish : () => publishSpecificLocale(activeLocale.code)
  const defaultLabel = publishAll ? label : t('version:publishIn', { locale: activeLocaleLabel })

  const secondaryPublish = publishAll ? () => publishSpecificLocale(activeLocale.code) : publish
  const secondaryLabel = publishAll
    ? t('version:publishIn', { locale: activeLocaleLabel })
    : t('version:publishAllLocales')

  if (!hasPublishPermission) {
    return null
  }

  return (
    <FormSubmit
      buttonId="action-save"
      disabled={!canPublish}
      onClick={defaultPublish}
      size="medium"
      SubMenuPopupContent={
        localization
          ? () => (
              <PopupList.ButtonGroup>
                <PopupList.Button onClick={secondaryPublish}>{secondaryLabel}</PopupList.Button>
              </PopupList.ButtonGroup>
            )
          : undefined
      }
      type="button"
    >
      {localization ? defaultLabel : label}
    </FormSubmit>
  )
}
