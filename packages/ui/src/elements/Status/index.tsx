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
import './index.css'

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
  const currentLocale = useLocale()
  const locale = currentLocale?.code
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
    try {
      if (collectionSlug) {
        const versionsURL = formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}/versions?where[parent][equals]=${encodeURIComponent(String(id))}&where[version._status][equals]=published&sort=-updatedAt&limit=1&locale=${locale}`,
        })

        const versionsRes = await requests.get(versionsURL, {
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        })

        if (!versionsRes.ok) {
          toast.error(t('error:revertingDocument'))
          return
        }

        const versionsJson = await versionsRes.json()
        const publishedVersion = versionsJson.docs?.[0]

        if (!publishedVersion?.id) {
          toast.error(t('error:revertingDocument'))
          return
        }

        const restoreURL = formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}/versions/${publishedVersion.id}?draft=false&locale=${locale}&fallback-locale=null`,
        })

        const res = await requests.post(restoreURL, {
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          toast.error(t('error:revertingDocument'))
          return
        }

        const json = await res.json()
        const { message, ...restoredDoc } = json
        await resetForm(restoredDoc)
        toast.success(message)
        incrementVersionCount()
        setMostRecentVersionIsAutosaved(false)
        setUnpublishedVersionCount(0)
        return
      }

      // Keep the existing behavior for globals until their version lookup
      // can be handled separately.
      if (globalSlug) {
        const url = formatAdminURL({
          apiRoute: api,
          path: `/globals/${globalSlug}?locale=${locale}&fallback-locale=null&depth=0`,
        })

        const publishedDoc = await requests
          .get(url, {
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
            },
          })
          .then((res) => res.json())

        const res = await requests.post(url, {
          body: JSON.stringify(publishedDoc),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        })

        if (res.status === 200) {
          const json = await res.json()
          await resetForm(json.result)
          toast.success(json.message)
          incrementVersionCount()
          setMostRecentVersionIsAutosaved(false)
          setUnpublishedVersionCount(0)
        } else {
          toast.error(t('error:revertingDocument'))
        }
      }
    } catch {
      toast.error(t('error:revertingDocument'))
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
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
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
          <span className={`${baseClass}__value`}>{t(`version:${displayStatusKey}`)}</span>

          {!isTrashed && canUpdate && hasPublishedDoc && statusToRender === 'changed' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="ghost"
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
