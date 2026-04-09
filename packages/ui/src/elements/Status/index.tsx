'use client'
import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
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
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
  } = useDocumentInfo()

  const { toggleModal } = useModal()

  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const { reset: resetForm } = useForm()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const revertModalSlug = `confirm-revert-${id}`

  let statusToRender: 'changed' | 'draft' | 'published'

  if (unpublishedVersionCount > 0 && hasPublishedDoc) {
    statusToRender = 'changed'
  } else if (!hasPublishedDoc) {
    statusToRender = 'draft'
  } else if (hasPublishedDoc && unpublishedVersionCount <= 0) {
    statusToRender = 'published'
  }

  const displayStatusKey = isTrashed
    ? hasPublishedDoc
      ? 'previouslyPublished'
      : 'previouslyDraft'
    : statusToRender

  const performAction = useCallback(async () => {
    let url
    let method

    if (collectionSlug) {
      url = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}/${id}?locale=${locale}&fallback-locale=null&depth=0`,
      })
      method = 'patch'
    }

    if (globalSlug) {
      url = formatAdminURL({
        apiRoute: api,
        path: `/globals/${globalSlug}?locale=${locale}&fallback-locale=null&depth=0`,
      })
      method = 'post'
    }

    const publishedDoc = await requests
      .get(url, {
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      })
      .then((res) => res.json())

    const body = publishedDoc

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
      setMostRecentVersionIsAutosaved(false)

      setUnpublishedVersionCount(0)
    } else {
      try {
        const json = await res.json()
        if (json.errors?.[0]?.message) {
          toast.error(json.errors[0].message)
        } else if (json.error) {
          toast.error(json.error)
        } else {
          toast.error(t('error:revertingDocument'))
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error(t('error:revertingDocument'))
      }
    }
  }, [
    api,
    collectionSlug,
    globalSlug,
    id,
    i18n.language,
    incrementVersionCount,
    locale,
    resetForm,
    setUnpublishedVersionCount,
    setMostRecentVersionIsAutosaved,
    t,
  ])

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

          {!isTrashed && canUpdate && hasPublishedDoc && statusToRender === 'changed' && (
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
                onConfirm={() => performAction()}
              />
            </React.Fragment>
          )}
        </div>
      </div>
    )
  }

  return null
}
