'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import * as qs from 'qs-esm'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useForm } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { PopupList } from '../Popup/index.js'
export function UnpublishButton() {
  const {
    id,
    collectionSlug,
    data: dataFromProps,
    globalSlug,
    hasLocalizedFields,
    hasPublishedDoc,
    incrementVersionCount,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
  } = useDocumentInfo()
  const { toggleModal } = useModal()

  const { config } = useConfig()
  const { reset: resetForm } = useForm()
  const { code: localeCode, label: localeLabel } = useLocale()
  const [unpublishSpecificLocale, setUnpublishSpecificLocale] = useState(false)

  const unPublishModalSlug = `confirm-un-publish-${id}`

  const {
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()

  const unpublish = useCallback(
    (unpublishSpecificLocale?: boolean) => {
      ;(async () => {
        let url
        let method

        const queryString = qs.stringify(
          {
            depth: '0',
            'fallback-locale': 'null',
            locale: localeCode,
            ...(unpublishSpecificLocale && localeCode
              ? { unpublishSpecificLocale: localeCode }
              : {}),
          },
          { addQueryPrefix: true },
        )

        if (collectionSlug) {
          url = `${serverURL}${api}/${collectionSlug}/${id}${queryString}`
          method = 'patch'
        }

        if (globalSlug) {
          url = `${serverURL}${api}/globals/${globalSlug}${queryString}`
          method = 'post'
        }

        try {
          const res = await requests[method](url, {
            body: JSON.stringify(unpublishSpecificLocale ? {} : { _status: 'draft' }),
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

  const canUnpublish = hasPublishedDoc

  const canUnpublishCurrentLocale = hasLocalizedFields && canUnpublish

  return (
    <React.Fragment>
      {canUnpublish && (
        <>
          <FormSubmit
            buttonId="action-unpublish"
            disabled={!canUnpublish}
            enableSubMenu={canUnpublishCurrentLocale}
            onClick={() => {
              setUnpublishSpecificLocale(false)
              toggleModal(unPublishModalSlug)
            }}
            size="medium"
            SubMenuPopupContent={({ close }) => {
              return (
                <PopupList.ButtonGroup>
                  <PopupList.Button
                    id="action-unpublish-locale"
                    onClick={() => {
                      setUnpublishSpecificLocale(true)
                      toggleModal(unPublishModalSlug)
                      close()
                    }}
                  >
                    {t('version:unpublishIn', { locale: getTranslation(localeLabel, i18n) })}
                  </PopupList.Button>
                </PopupList.ButtonGroup>
              )
            }}
            type="button"
          >
            {t('version:unpublish')}
          </FormSubmit>
          <ConfirmationModal
            body={
              unpublishSpecificLocale
                ? t('version:aboutToUnpublishIn', { locale: getTranslation(localeLabel, i18n) })
                : t('version:aboutToUnpublish')
            }
            confirmingLabel={t('version:unpublishing')}
            heading={t('version:confirmUnpublish')}
            modalSlug={unPublishModalSlug}
            onConfirm={() => unpublish(unpublishSpecificLocale)}
          />
        </>
      )}
    </React.Fragment>
  )
}
