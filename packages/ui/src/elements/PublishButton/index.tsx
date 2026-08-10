'use client'

import type { PublishButtonClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, hasAutosaveEnabled, hasLocalizeStatusEnabled } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useState } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { PopupList } from '../Popup/index.js'
import './index.css'

export function PublishButton({
  label: labelProp,
}: { label?: string } & PublishButtonClientProps = {}) {
  const {
    id,
    collectionSlug,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
    uploadStatus,
  } = useDocumentInfo()

  const { config, getEntityConfig } = useConfig()
  const { submit } = useForm()
  const modified = useFormModified()
  const editDepth = useEditDepth()
  const { code: localeCode } = useLocale()
  const {
    localization,
    routes: { api },
  } = config

  const { i18n, t } = useTranslation()
  const label = labelProp || t('version:publishChanges')
  const shortLabel = labelProp || t('version:publish')

  const entityConfig = React.useMemo(() => {
    if (collectionSlug) {
      return getEntityConfig({ collectionSlug })
    }

    if (globalSlug) {
      return getEntityConfig({ globalSlug })
    }
  }, [collectionSlug, globalSlug, getEntityConfig])

  const hasNewerVersions = unpublishedVersionCount > 0

  const canPublish =
    hasPublishPermission &&
    (modified || hasNewerVersions || !hasPublishedDoc) &&
    uploadStatus !== 'uploading'

  const [hasLocalizedFields, setHasLocalizedFields] = useState(false)

  useEffect(() => {
    const hasLocalizedField = traverseForLocalizedFields(entityConfig?.fields)
    setHasLocalizedFields(hasLocalizedField)
  }, [entityConfig?.fields])

  const isSpecificLocalePublishEnabled = localization && hasLocalizedFields && hasPublishPermission

  const operation = useOperation()

  const disabled = operation === 'update' && !modified

  // If autosave is enabled the modified will always be true so only conditionally check on modified state
  const hasAutosave = hasAutosaveEnabled(entityConfig)

  const saveDraft = useCallback(async () => {
    if (disabled) {
      return
    }

    const params = qs.stringify(
      {
        depth: 0,
        draft: true,
        'fallback-locale': 'null',
        locale: localeCode,
      },
      { addQueryPrefix: true },
    )

    let action
    let method = 'POST'

    if (collectionSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}${id ? `/${id}` : ''}${params}`,
      })
      if (id) {
        method = 'PATCH'
      }
    }

    if (globalSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/globals/${globalSlug}${params}`,
      })
    }

    await submit({
      action,
      method,
      overrides: {
        _status: 'draft',
      },
      skipValidation: true,
    })
  }, [disabled, localeCode, collectionSlug, globalSlug, submit, api, id])

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (saveDraft && hasAutosave) {
      void saveDraft()
    }
  })

  const localizeStatusEnabled = hasLocalizeStatusEnabled(entityConfig)

  const publish = useCallback(async () => {
    if (uploadStatus === 'uploading') {
      return
    }

    const params = qs.stringify(
      {
        depth: 0,
        locale: localeCode,
        ...(localizeStatusEnabled && { publishAllLocales: true }),
      },
      { addQueryPrefix: true },
    )

    const action = formatAdminURL({
      apiRoute: api,
      path: `${
        globalSlug ? `/globals/${globalSlug}` : `/${collectionSlug}${id ? `/${id}` : ''}`
      }${params}` as `/${string}`,
    })

    const result = await submit({
      action,
      overrides: {
        _status: 'published',
      },
    })

    if (result) {
      setUnpublishedVersionCount(0)
      setMostRecentVersionIsAutosaved(false)
      setHasPublishedDoc(true)
    }
  }, [
    localeCode,
    localizeStatusEnabled,
    api,
    collectionSlug,
    globalSlug,
    id,
    setHasPublishedDoc,
    submit,
    setUnpublishedVersionCount,
    uploadStatus,
    setMostRecentVersionIsAutosaved,
  ])

  const publishLocale = useCallback(
    async (locale) => {
      if (uploadStatus === 'uploading') {
        return
      }

      const params = qs.stringify(
        {
          depth: 0,
          locale,
        },
        { addQueryPrefix: true },
      )

      const pathSegment = globalSlug
        ? `/globals/${globalSlug}`
        : `/${collectionSlug}${id ? `/${id}` : ''}`
      const action = formatAdminURL({
        apiRoute: api,
        path: `${pathSegment}${params}` as `/${string}`,
      })

      const result = await submit({
        action,
        overrides: {
          _status: 'published',
        },
      })

      if (result) {
        setUnpublishedVersionCount(0)
        setMostRecentVersionIsAutosaved(false)
        setHasPublishedDoc(true)
      }
    },
    [
      api,
      collectionSlug,
      globalSlug,
      id,
      setHasPublishedDoc,
      setMostRecentVersionIsAutosaved,
      setUnpublishedVersionCount,
      submit,
      uploadStatus,
    ],
  )

  // Publish to all locales unless there are localized fields AND defaultLocalePublishOption is 'active'
  const isDefaultPublishAll =
    !isSpecificLocalePublishEnabled ||
    (localization && localization?.defaultLocalePublishOption !== 'active')

  const activeLocale =
    localization &&
    localization?.locales.find((locale) =>
      typeof locale === 'string' ? locale === localeCode : locale.code === localeCode,
    )

  const activeLocaleLabel = activeLocale && getTranslation(activeLocale.label, i18n)

  if (!hasPublishPermission) {
    return null
  }

  return (
    <React.Fragment>
      <FormSubmit
        buttonId="action-save"
        disabled={!canPublish}
        onClick={isDefaultPublishAll ? publish : () => publishLocale(activeLocale.code)}
        size="medium"
        SubMenuPopupContent={
          isSpecificLocalePublishEnabled
            ? ({ close }) => {
                return (
                  <React.Fragment>
                    {isSpecificLocalePublishEnabled && (
                      <PopupList.ButtonGroup>
                        <PopupList.Button
                          id="publish-locale"
                          onClick={
                            isDefaultPublishAll ? () => publishLocale(activeLocale.code) : publish
                          }
                        >
                          {isDefaultPublishAll
                            ? t('version:publishIn', { locale: activeLocaleLabel })
                            : t('version:publishAllLocales')}
                        </PopupList.Button>
                      </PopupList.ButtonGroup>
                    )}
                  </React.Fragment>
                )
              }
            : undefined
        }
        type="button"
      >
        {!isDefaultPublishAll ? (
          t('version:publishIn', { locale: activeLocaleLabel })
        ) : (
          <React.Fragment>
            <span className="publish-button__label--full">{label}</span>
            <span className="publish-button__label--short">{shortLabel}</span>
          </React.Fragment>
        )}
      </FormSubmit>
    </React.Fragment>
  )
}
