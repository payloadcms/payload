'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { drawerZBase } from '../Drawer/index.js'
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
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
  } = useDocumentInfo()
  const { toggleModal } = useModal()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const [processing, setProcessing] = useState(false)
  const { reset: resetForm } = useForm()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const editDepth = useEditDepth()

  const unPublishModalSlug = `confirm-un-publish-${id}`
  const revertModalSlug = `confirm-revert-${id}`

  let statusToRender: 'changed' | 'draft' | 'published'

  if (unpublishedVersionCount > 0 && hasPublishedDoc) {
    statusToRender = 'changed'
  } else if (!hasPublishedDoc) {
    statusToRender = 'draft'
  } else if (hasPublishedDoc && unpublishedVersionCount <= 0) {
    statusToRender = 'published'
  }

  const performAction = useCallback(
    async (action: 'revert' | 'unpublish') => {
      let url
      let method
      let body

      setProcessing(true)

      if (action === 'unpublish') {
        body = {
          _status: 'draft',
        }
      }

      if (collectionSlug) {
        url = `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}&fallback-locale=null&depth=0`
        method = 'patch'
      }
      if (globalSlug) {
        url = `${serverURL}${api}/globals/${globalSlug}?locale=${locale}&fallback-locale=null&depth=0`
        method = 'post'
      }

      if (action === 'revert') {
        const publishedDoc = await requests
          .get(url, {
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
            },
          })
          .then((res) => res.json())

        body = publishedDoc
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
        setMostRecentVersionIsAutosaved(false)

        if (action === 'unpublish') {
          setHasPublishedDoc(false)
        } else if (action === 'revert') {
          setUnpublishedVersionCount(0)
        }
      } else {
        toast.error(t('error:unPublishingDocument'))
      }

      setProcessing(false)
      if (action === 'revert') {
        toggleModal(revertModalSlug)
      }

      if (action === 'unpublish') {
        toggleModal(unPublishModalSlug)
      }
    },
    [
      api,
      collectionSlug,
      globalSlug,
      id,
      i18n.language,
      incrementVersionCount,
      locale,
      resetForm,
      serverURL,
      setUnpublishedVersionCount,
      t,
      toggleModal,
      revertModalSlug,
      unPublishModalSlug,
      setHasPublishedDoc,
    ],
  )

  const canUpdate = docPermissions?.update

  if (statusToRender) {
    return (
      <div
        className={baseClass}
        title={`${t('version:status')}: ${t(`version:${statusToRender}`)}`}
      >
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__label`}>{t('version:status')}:&nbsp;</span>
          <span className={`${baseClass}__value`}>{t(`version:${statusToRender}`)}</span>
          {canUpdate && statusToRender === 'published' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                onClick={() => toggleModal(unPublishModalSlug)}
              >
                {t('version:unpublish')}
              </Button>
              <Modal
                className={`${baseClass}__modal`}
                slug={unPublishModalSlug}
                style={{ zIndex: drawerZBase + editDepth }}
              >
                <div className={`${baseClass}__wrapper`}>
                  <div className={`${baseClass}__content`}>
                    <h1>{t('version:confirmUnpublish')}</h1>
                    <p>{t('version:aboutToUnpublish')}</p>
                  </div>
                  <div className={`${baseClass}__controls`}>
                    <Button
                      buttonStyle="secondary"
                      onClick={processing ? undefined : () => toggleModal(unPublishModalSlug)}
                      size="large"
                      type="button"
                    >
                      {t('general:cancel')}
                    </Button>
                    <Button
                      onClick={processing ? undefined : () => performAction('unpublish')}
                      size="large"
                    >
                      {t(processing ? 'version:unpublishing' : 'general:confirm')}
                    </Button>
                  </div>
                </div>
              </Modal>
            </React.Fragment>
          )}
          {canUpdate && statusToRender === 'changed' && (
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
              <Modal className={`${baseClass}__modal`} slug={revertModalSlug}>
                <div className={`${baseClass}__wrapper`}>
                  <div className={`${baseClass}__content`}>
                    <h1>{t('version:confirmRevertToSaved')}</h1>
                    <p>{t('version:aboutToRevertToPublished')}</p>
                  </div>
                  <div className={`${baseClass}__controls`}>
                    <Button
                      buttonStyle="secondary"
                      onClick={processing ? undefined : () => toggleModal(revertModalSlug)}
                      size="large"
                      type="button"
                    >
                      {t('general:cancel')}
                    </Button>
                    <Button
                      id="action-revert-to-published-confirm"
                      onClick={processing ? undefined : () => performAction('revert')}
                      size="large"
                    >
                      {t(processing ? 'version:reverting' : 'general:confirm')}
                    </Button>
                  </div>
                </div>
              </Modal>
            </React.Fragment>
          )}
        </div>
      </div>
    )
  }

  return null
}
