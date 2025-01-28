'use client'

import { useModal } from '@faceless-ui/modal'
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
import { ScheduleDrawer } from './ScheduleDrawer/index.js'

export const PublishButton: React.FC<{ label?: string }> = ({ label: labelProp }) => {
  const {
    id,
    collectionSlug,
    docConfig,
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
  const { isModalOpen, toggleModal } = useModal()

  const drawerSlug = `schedule-publish-${id}`

  const {
    localization,
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()
  const label = labelProp || t('version:publishChanges')

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

  const scheduledPublishEnabled =
    typeof entityConfig?.versions?.drafts === 'object' &&
    entityConfig?.versions?.drafts.schedulePublish

  const canSchedulePublish = Boolean(
    scheduledPublishEnabled && hasPublishPermission && (globalSlug || (collectionSlug && id)),
  )

  const operation = useOperation()

  const disabled = operation === 'update' && !modified

  const saveDraft = useCallback(async () => {
    if (disabled) {
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
  }, [submit, collectionSlug, globalSlug, serverURL, api, localeCode, id, disabled])

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (saveDraft && docConfig.versions?.drafts && docConfig.versions?.drafts?.autosave) {
      void saveDraft()
    }
  })

  const publish = useCallback(() => {
    if (uploadStatus === 'uploading') {
      return
    }

    void submit({
      overrides: {
        _status: 'published',
      },
    })

    setUnpublishedVersionCount(0)
    setMostRecentVersionIsAutosaved(false)
    setHasPublishedDoc(true)
  }, [
    setHasPublishedDoc,
    submit,
    setUnpublishedVersionCount,
    uploadStatus,
    setMostRecentVersionIsAutosaved,
  ])

  const publishSpecificLocale = useCallback(
    (locale) => {
      if (uploadStatus === 'uploading') {
        return
      }

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
    [api, collectionSlug, globalSlug, id, serverURL, setHasPublishedDoc, submit, uploadStatus],
  )

  if (!hasPublishPermission) {
    return null
  }

  return (
    <React.Fragment>
      <FormSubmit
        buttonId="action-save"
        disabled={!canPublish}
        onClick={publish}
        size="medium"
        SubMenuPopupContent={
          localization || canSchedulePublish
            ? ({ close }) => {
                return (
                  <React.Fragment>
                    {canSchedulePublish && (
                      <PopupList.ButtonGroup key="schedule-publish">
                        <PopupList.Button onClick={() => [toggleModal(drawerSlug), close()]}>
                          {t('version:schedulePublish')}
                        </PopupList.Button>
                      </PopupList.ButtonGroup>
                    )}
                    {localization
                      ? localization.locales.map((locale) => {
                          const formattedLabel =
                            typeof locale.label === 'string'
                              ? locale.label
                              : locale.label && locale.label[i18n?.language]

                          const isActive =
                            typeof locale === 'string'
                              ? locale === localeCode
                              : locale.code === localeCode

                          if (isActive) {
                            return (
                              <PopupList.ButtonGroup key={locale.code}>
                                <PopupList.Button
                                  onClick={() => [publishSpecificLocale(locale.code), close()]}
                                >
                                  {t('version:publishIn', {
                                    locale: formattedLabel || locale.code,
                                  })}
                                </PopupList.Button>
                              </PopupList.ButtonGroup>
                            )
                          }
                        })
                      : null}
                  </React.Fragment>
                )
              }
            : undefined
        }
        type="button"
      >
        {label}
      </FormSubmit>
      {canSchedulePublish && isModalOpen(drawerSlug) && <ScheduleDrawer slug={drawerSlug} />}
    </React.Fragment>
  )
}
