'use client'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useForm } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
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
    docConfig,
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
  const editDepth = useEditDepth()
  const { code: localeCode } = useLocale()
  const [unpublishSpecificLocale, setUnpublishSpecificLocale] = useState(false)

  const unPublishModalSlug = `confirm-un-publish-${id}`

  const {
    localization,
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()

  const unpublish = useCallback(
    (unpublishSpecificLocale?: boolean) => {
      ;(async () => {
        let url
        let method

        const body = unpublishSpecificLocale ? {} : { _status: 'draft' }
        const params =
          unpublishSpecificLocale && localeCode ? `&unpublishSpecificLocale=${localeCode}` : ''

        if (collectionSlug) {
          url = `${serverURL}${api}/${collectionSlug}/${id}?locale=${localeCode}&fallback-locale=null&depth=0${params}`
          method = 'patch'
        }

        if (globalSlug) {
          url = `${serverURL}${api}/globals/${globalSlug}?locale=${localeCode}&fallback-locale=null&depth=0${params}`
          method = 'post'
        }

        try {
          const res = await requests[method](url, {
            body: JSON.stringify(body),
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

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (unpublish && docConfig.versions?.drafts && docConfig.versions?.drafts?.autosave) {
      unpublish(false)
    }
  })

  const canUnpublish = hasPublishedDoc

  const canUnpublishCurrentLocale = hasLocalizedFields && canUnpublish

  const activeLocale =
    localization &&
    localization?.locales.find((locale) =>
      typeof locale === 'string' ? locale === localeCode : locale.code === localeCode,
    )

  const activeLocaleLabel =
    activeLocale &&
    (typeof activeLocale.label === 'string'
      ? activeLocale.label
      : (activeLocale.label?.[i18n.language] ?? undefined))

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
                    {t('version:unpublishIn', { locale: activeLocaleLabel })}
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
                ? t('version:aboutToUnpublishIn', { locale: activeLocaleLabel })
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
