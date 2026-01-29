'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useForm } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { PopupList } from '../Popup/index.js'
export function UnpublishButton() {
  const {
    id,
    collectionSlug,
    data: dataFromProps,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    incrementVersionCount,
    isTrashed,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
  } = useDocumentInfo()
  const { toggleModal } = useModal()

  const { config, getEntityConfig } = useConfig()
  const { reset: resetForm } = useForm()
  const { code: localeCode, label: localeLabel } = useLocale()
  const [unpublishAll, setUnpublishAll] = useState(false)

  const unPublishModalSlug = `confirm-un-publish-${id}`

  const {
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()

  const entityConfig = React.useMemo(() => {
    if (collectionSlug) {
      return getEntityConfig({ collectionSlug })
    }

    if (globalSlug) {
      return getEntityConfig({ globalSlug })
    }
  }, [collectionSlug, globalSlug, getEntityConfig])

  const unpublish = useCallback(
    (unpublishAll?: boolean) => {
      ; (async () => {
        let url
        let method

        const queryString = qs.stringify(
          {
            depth: 0,
            'fallback-locale': 'null',
            locale: unpublishAll ? undefined : localeCode,
            unpublishAllLocales: unpublishAll,
          },
          { addQueryPrefix: true },
        )

        if (collectionSlug) {
          url = formatAdminURL({
            apiRoute: api,
            path: `/${collectionSlug}/${id}${queryString}`,
            serverURL,
          })
          method = 'patch'
        }

        if (globalSlug) {
          url = formatAdminURL({
            apiRoute: api,
            path: `/globals/${globalSlug}${queryString}`,
            serverURL,
          })
          method = 'post'
        }

        try {
          const res = await requests[method](url, {
            body: JSON.stringify({ _status: 'draft' }),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
            },
          })

          if (res.status === 200) {
            void resetForm({
              ...(dataFromProps || {}),
              _status: 'draft',
            })

            toast.success(t('version:unpublishedSuccessfully'))
            incrementVersionCount()
            setUnpublishedVersionCount(1)
            setMostRecentVersionIsAutosaved(false)
            setHasPublishedDoc(false)
          } else {
            try {
              const json = await res.json()
              if (json.errors?.[0]?.message) {
                toast.error(json.errors[0].message)
              } else if (json.error) {
                toast.error(json.error)
              } else {
                toast.error(t('error:unPublishingDocument'))
              }
            } catch {
              toast.error(t('error:unPublishingDocument'))
            }
          }
        } catch {
          toast.error(t('error:unPublishingDocument'))
        }
      })().catch(() => {
        toast.error(t('error:unPublishingDocument'))
      })
    },
    [
      dataFromProps,
      resetForm,
      collectionSlug,
      globalSlug,
      serverURL,
      api,
      localeCode,
      id,
      i18n.language,
      incrementVersionCount,
      setHasPublishedDoc,
      setMostRecentVersionIsAutosaved,
      setUnpublishedVersionCount,
      t,
    ],
  )

  const [hasLocalizedFields, setHasLocalizedFields] = useState(false)

  useEffect(() => {
    const hasLocalizedField = traverseForLocalizedFields(entityConfig?.fields)
    setHasLocalizedFields(hasLocalizedField)
  }, [entityConfig?.fields])

  const canUnpublish = React.useMemo(
    () => hasPublishPermission && hasPublishedDoc && !isTrashed,
    [hasPublishPermission, hasPublishedDoc, isTrashed],
  )

  const canUnpublishCurrentLocale = React.useMemo(() => {
    if (!canUnpublish || !hasLocalizedFields) { return false }

    const drafts = entityConfig?.versions?.drafts
    const hasDraftsConfig = typeof drafts === 'object' && drafts !== null
    const localizeStatusConfigured = hasDraftsConfig && drafts.localizeStatus === true
    const experimentalLocalizeStatus =
      config.experimental &&
      'localizeStatus' in config.experimental &&
      config.experimental.localizeStatus === true

    return localizeStatusConfigured && experimentalLocalizeStatus
  }, [canUnpublish, hasLocalizedFields, entityConfig?.versions?.drafts, config.experimental])

  return (
    <React.Fragment>
      {canUnpublish && (
        <>
          {canUnpublish && <PopupList.Button
            id="action-unpublish"
            onClick={() => {
              setUnpublishAll(true)
              toggleModal(unPublishModalSlug)
            }}
          >
            {t('version:unpublish', { locale: getTranslation(localeLabel, i18n) })}
          </PopupList.Button>}
          {canUnpublishCurrentLocale && <PopupList.Button
            id="action-unpublish-locale"
            onClick={() => {
              setUnpublishAll(false)
              toggleModal(unPublishModalSlug)
              close()
            }}
          >
            {t('version:unpublishIn', { locale: getTranslation(localeLabel, i18n) })}
          </PopupList.Button>}
          <ConfirmationModal
            body={
              !unpublishAll
                ? t('version:aboutToUnpublishIn', { locale: getTranslation(localeLabel, i18n) })
                : t('version:aboutToUnpublish')
            }
            confirmingLabel={t('version:unpublishing')}
            heading={t('version:confirmUnpublish')}
            modalSlug={unPublishModalSlug}
            onConfirm={() => unpublish(unpublishAll)}
          />
        </>
      )}
    </React.Fragment>
  )
}
