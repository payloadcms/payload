'use client'

import type { MappedComponent } from 'payload'

import * as qs from 'qs-esm'
import React, { useCallback } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useConfig } from '../../providers/Config/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { PopupList } from '../Popup/index.js'
export const DefaultPublishButton: React.FC<{ label?: string }> = ({ label: labelProp }) => {
  const {
    id,
    collectionSlug,
    docConfig,
    globalSlug,
    hasPublishPermission,
    publishedDoc,
    unpublishedVersions,
  } = useDocumentInfo()

  const { config } = useConfig()
  const { submit } = useForm()
  const modified = useFormModified()
  const editDepth = useEditDepth()

  const {
    localization,
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()
  const { code } = useLocale()
  const label = labelProp || t('version:publishChanges')

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0
  const canPublish = hasPublishPermission && (modified || hasNewerVersions || !publishedDoc)
  const operation = useOperation()

  const forceDisable = operation === 'update' && !modified

  const saveDraft = useCallback(async () => {
    if (forceDisable) {
      return
    }

    const search = `?locale=${code}&depth=0&fallback-locale=null&draft=true`
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
  }, [submit, collectionSlug, globalSlug, serverURL, api, code, id, forceDisable])

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
  }, [submit])

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
    },
    [api, collectionSlug, globalSlug, id, serverURL, submit],
  )

  const publishAll =
    localization && localization.defaultLocalePublishOption !== 'active' ? true : false

  const activeLocale =
    localization &&
    localization?.locales.find((locale) =>
      typeof locale === 'string' ? locale === code : locale.code === code,
    )

  const activeLocaleLabel =
    typeof activeLocale.label === 'string' ? activeLocale.label : activeLocale.label[i18n?.language]

  const defaultPublish = publishAll ? publish : () => publishSpecificLocale(activeLocale.code)
  const defaultLabel = publishAll ? label : t('version:publishIn', { locale: activeLocaleLabel })

  const secondaryPublish = publishAll ? () => publishSpecificLocale(activeLocale.code) : publish
  const secondaryLabel = publishAll
    ? t('version:publishIn', { locale: activeLocaleLabel })
    : 'Publish all locales'

  // TODO: add publish all locales translation key

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
        <PopupList.ButtonGroup>
          <PopupList.Button onClick={secondaryPublish}>{secondaryLabel}</PopupList.Button>
        </PopupList.ButtonGroup>
      }
      type="button"
    >
      {defaultLabel}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: MappedComponent
}

export const PublishButton: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) {
    return <RenderComponent mappedComponent={CustomComponent} />
  }
  return <DefaultPublishButton />
}
