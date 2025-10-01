'use client'

import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useState } from 'react'
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
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { PopupList } from '../Popup/index.js'

export function UnpublishButton() {
  const {
    id,
    collectionSlug,
    docConfig,
    globalSlug,
    hasPublishedDoc,
    incrementVersionCount,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
  } = useDocumentInfo()

  const { config, getEntityConfig } = useConfig()
  const { reset: resetForm } = useForm()
  const editDepth = useEditDepth()
  const { code: localeCode } = useLocale()

  const {
    localization,
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


  const [hasLocalizedFields, setHasLocalizedFields] = useState(false)

  useEffect(() => {
    const hasLocalizedField = traverseForLocalizedFields(entityConfig?.fields)
    setHasLocalizedFields(hasLocalizedField)
  }, [entityConfig?.fields])


  const unpublish = useCallback(async () => {
    let url
    let method
    const body = {
      _status: 'draft',
    }
    if (collectionSlug) {
      url = `${serverURL}${api}/${collectionSlug}/${id}?locale=${localeCode}&fallback-locale=null&depth=0`
      method = 'patch'
    }

    if (globalSlug) {
      url = `${serverURL}${api}/globals/${globalSlug}?locale=${localeCode}&fallback-locale=null&depth=0`
      method = 'post'
    }

    const res = await requests[method](url, {
      body: JSON.stringify(body),
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      },
    })

    if (res.status === 200) {
      let data
      const json = await res.json()

      if (globalSlug) {
        data = json.result
      } else if (collectionSlug) {
        data = json.doc
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      resetForm(data)
      toast.success(json.message)
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
      } catch (err) {
        toast.error(t('error:unPublishingDocument'))
      }
    }
  }, [
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
  ])

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (unpublish && docConfig.versions?.drafts && docConfig.versions?.drafts?.autosave) {
      void unpublish()
    }
  })

  const unpublishSpecificLocale = useCallback(
    async (locale) => {
      let url
      let method
      const params = qs.stringify({
        unpublishSpecificLocale: locale,
      })
      const body = {
        _status: 'published',
      }

      if (collectionSlug) {
        url = `${serverURL}${api}/${collectionSlug}/${id}?locale=${localeCode}&fallback-locale=null&depth=0${params ? '?' + params : ''}`
        method = 'patch'
      }

      if (globalSlug) {
        url = `${serverURL}${api}/globals/${globalSlug}?locale=${localeCode}&fallback-locale=null&depth=0${params ? '?' + params : ''}`
        method = 'post'
      }

      const result = await requests[method](url, {
        body: JSON.stringify(body),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      })

      if (result) {
        setHasPublishedDoc(true)
      }
    },
    [api, collectionSlug, globalSlug, id, serverURL, setHasPublishedDoc, i18n.language, localeCode],
  )

  const canUnpublish = hasPublishedDoc && unpublishedVersionCount === 0

  const canUnpublishCurrentLocale = hasLocalizedFields && hasPublishedDoc

  const activeLocale =
    localization &&
    localization?.locales.find((locale) =>
      typeof locale === 'string' ? locale === localeCode : locale.code === localeCode,
    )

  const activeLocaleLabel =
    activeLocale &&
    (typeof activeLocale.label === 'string'
      ? activeLocale.label
      : (activeLocale.label?.[localeCode] ?? undefined))

  return (
    <React.Fragment>
      {canUnpublish &&
        <FormSubmit
          buttonId="action-unpublish"
          disabled={!canUnpublish}
          enableSubMenu={canUnpublishCurrentLocale}
          onClick={unpublish}
          size="medium"
          SubMenuPopupContent={
            canUnpublishCurrentLocale
              ? ({ close }) => {
                return (
                  <PopupList.ButtonGroup>
                    <PopupList.Button id="action-unpublish-locale" onClick={unpublishSpecificLocale}>
                      Unpublish in {activeLocaleLabel}
                    </PopupList.Button>
                  </PopupList.ButtonGroup>
                )
              }
              : undefined
          }
          type="button"
        >
          Unpublish
        </FormSubmit>
      }
    </React.Fragment>
  )
}
