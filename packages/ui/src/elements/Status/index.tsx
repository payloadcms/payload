'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import './index.scss'

const baseClass = 'status'

export const Status: React.FC = () => {
  const {
    id,
    collectionSlug,
    docPermissions,
    globalSlug,
    hasPublishedDoc,
    incrementVersionCount,
    isTrashed,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
  } = useDocumentInfo()

  const { toggleModal } = useModal()

  const {
    config: {
      experimental: { unpublishSpecificLocale: enableUnpublishSpecificLocale } = {},
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const { getData, reset: resetForm } = useForm()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const formData = getData()
  const unPublishModalSlug = `confirm-un-publish-${id}`
  const localeUnPublishModalSlug = `confirm-un-publish-locale-${id}`
  const revertModalSlug = `confirm-revert-${id}`

  const [statusToRender, setStatusToRender] = React.useState<'changed' | 'draft' | 'published'>(
    'draft',
  )

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const docConfig = collectionConfig || globalConfig
  const autosaveEnabled =
    typeof docConfig?.versions?.drafts === 'object' ? docConfig.versions.drafts.autosave : false

  React.useEffect(() => {
    if (autosaveEnabled) {
      if (hasPublishedDoc) {
        setStatusToRender(unpublishedVersionCount > 0 ? 'changed' : 'published')
      }
    } else {
      setStatusToRender(formData._status || 'draft')
    }
  }, [autosaveEnabled, hasPublishedDoc, unpublishedVersionCount, formData._status])

  const displayStatusKey = isTrashed
    ? hasPublishedDoc
      ? 'previouslyPublished'
      : 'previouslyDraft'
    : statusToRender

  const performAction = useCallback(
    async (action: 'revert' | 'unpublish', unpublishSpecificLocale?: boolean) => {
      let url
      let publishedDocURL
      let method: 'get' | 'patch' | 'post' = 'patch'
      let body

      const headers = {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      }

      const baseUrl = collectionSlug
        ? `${serverURL}${api}/${collectionSlug}/${id}`
        : globalSlug
          ? `${serverURL}${api}/globals/${globalSlug}`
          : ''

      if (action === 'unpublish') {
        url = `${baseUrl}/unpublish${locale ? `?locale=${locale}` : ''}${unpublishSpecificLocale ? `&unpublishSpecificLocale=true` : ''}`
        method = 'post'
      } else {
        publishedDocURL = `${baseUrl}?locale=${locale}&fallback-locale=null&depth=0`
        url = `${baseUrl}?publishSpecificLocale=${locale}`
        method = collectionSlug ? 'patch' : 'post'
      }

      if (action === 'revert') {
        const publishedDoc = await requests
          .get(publishedDocURL, {
            headers,
          })
          .then((res) => res.json())

        body = publishedDoc._status === 'published' ? publishedDoc : undefined
        if (!body) {
          toast.error(t('version:revertUnsuccessful'))
          return
        }
      }

      const res = await requests[method](url, {
        body: JSON.stringify(body),
        headers,
      })

      if (res.status === 200) {
        const json = await res.json()
        const data = action === 'revert' && !globalSlug ? json.doc : json.result

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        resetForm(data)
        toast.success(json.message)
        setMostRecentVersionIsAutosaved(false)
        if (action === 'unpublish') {
          setStatusToRender('draft')
        } else if (action === 'revert') {
          setHasPublishedDoc(true)
          incrementVersionCount()
          setUnpublishedVersionCount(0)
        }
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
    },
    [
      api,
      collectionSlug,
      globalSlug,
      id,
      locale,
      serverURL,
      i18n.language,
      resetForm,
      incrementVersionCount,
      setUnpublishedVersionCount,
      setMostRecentVersionIsAutosaved,
      t,
      setHasPublishedDoc,
    ],
  )

  const canUpdate = docPermissions?.update

  if (statusToRender) {
    return (
      <div
        className={baseClass}
        title={`${t('version:status')}: ${t(`version:${displayStatusKey}`)}`}
      >
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__label`}>{t('version:status')}:&nbsp;</span>
          <span className={`${baseClass}__value`}>{t(`version:${displayStatusKey}`)}</span>
          {!isTrashed && canUpdate && statusToRender === 'published' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                id={`action-unpublish`}
                onClick={() => toggleModal(unPublishModalSlug)}
              >
                {t('version:unpublish')}
              </Button>
              <ConfirmationModal
                body={t('version:aboutToUnpublish')}
                confirmingLabel={t('version:unpublishing')}
                heading={t('version:confirmUnpublish')}
                modalSlug={unPublishModalSlug}
                onConfirm={() => performAction('unpublish')}
              />
              {enableUnpublishSpecificLocale && (
                // TODO: update when we get UI design
                <>
                  &nbsp;&mdash;&nbsp;
                  <Button
                    buttonStyle="none"
                    className={`${baseClass}__action`}
                    id={`action-unpublish-locale`}
                    onClick={() => toggleModal(localeUnPublishModalSlug)}
                  >
                    {t('version:unpublish')} ({locale})
                  </Button>
                  <ConfirmationModal
                    body={t('version:aboutToUnpublishIn', { locale })}
                    confirmingLabel={t('version:unpublishing')}
                    heading={t('version:confirmUnpublish')}
                    modalSlug={localeUnPublishModalSlug}
                    onConfirm={() => performAction('unpublish', true)}
                  />
                </>
              )}
            </React.Fragment>
          )}
          {!isTrashed && canUpdate && statusToRender === 'changed' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                id="action-revert-to-published"
                onClick={() => toggleModal(revertModalSlug)}
              >
                {t('version:revertToPublished')}
              </Button>
              <ConfirmationModal
                body={t('version:aboutToRevertToPublished')}
                confirmingLabel={t('version:reverting')}
                heading={t('version:confirmRevertToSaved')}
                modalSlug={revertModalSlug}
                onConfirm={() => performAction('revert')}
              />
            </React.Fragment>
          )}
        </div>
      </div>
    )
  }

  return null
}
