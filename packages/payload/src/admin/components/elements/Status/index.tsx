import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import type { Field } from '../../../../fields/config/types'

import { MinimalTemplate } from '../..'
import { requests } from '../../../api'
import { useForm } from '../../forms/Form/context'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import Button from '../Button'
import './index.scss'

const baseClass = 'status'

const Status: React.FC = () => {
  const { id, collection, docPermissions, getVersions, global, publishedDoc, unpublishedVersions } =
    useDocumentInfo()
  const { toggleModal } = useModal()
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const [processing, setProcessing] = useState(false)
  const { reset: resetForm } = useForm()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation('version')

  const unPublishModalSlug = `confirm-un-publish-${id}`
  const revertModalSlug = `confirm-revert-${id}`

  let statusToRender

  if (unpublishedVersions?.docs?.length > 0 && publishedDoc) {
    statusToRender = 'changed'
  } else if (!publishedDoc) {
    statusToRender = 'draft'
  } else if (publishedDoc && unpublishedVersions?.docs?.length <= 1) {
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

      if (action === 'revert') {
        body = publishedDoc
      }

      if (collection) {
        url = `${serverURL}${api}/${collection.slug}/${id}?locale=${locale}&fallback-locale=null`
        method = 'patch'
      }
      if (global) {
        url = `${serverURL}${api}/globals/${global.slug}?locale=${locale}&fallback-locale=null`
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
        let fields: Field[]
        const json = await res.json()

        if (global) {
          data = json.result
          fields = global.fields
        }

        if (collection) {
          data = json.doc
          fields = collection.fields
        }

        resetForm(fields, data)
        toast.success(json.message)
        getVersions()
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
      collection,
      global,
      publishedDoc,
      serverURL,
      api,
      id,
      i18n,
      locale,
      resetForm,
      getVersions,
      t,
      toggleModal,
      revertModalSlug,
      unPublishModalSlug,
    ],
  )

  const canUpdate = docPermissions?.update?.permission

  if (statusToRender) {
    return (
      <div className={baseClass} title={`${t('status')}: ${t(statusToRender)}`}>
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__label`}>{t('status')}:&nbsp;</span>
          <span className={`${baseClass}__value`}>{t(statusToRender)}</span>
          {canUpdate && statusToRender === 'published' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                onClick={() => toggleModal(unPublishModalSlug)}
              >
                {t('unpublish')}
              </Button>
              <Modal className={`${baseClass}__modal`} slug={unPublishModalSlug}>
                <MinimalTemplate className={`${baseClass}__modal-template`}>
                  <h1>{t('confirmUnpublish')}</h1>
                  <p>{t('aboutToUnpublish')}</p>
                  <Button
                    buttonStyle="secondary"
                    onClick={processing ? undefined : () => toggleModal(unPublishModalSlug)}
                    type="button"
                  >
                    {t('general:cancel')}
                  </Button>
                  <Button onClick={processing ? undefined : () => performAction('unpublish')}>
                    {t(processing ? 'unpublishing' : 'general:confirm')}
                  </Button>
                </MinimalTemplate>
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
                {t('revertToPublished')}
              </Button>
              <Modal className={`${baseClass}__modal`} slug={revertModalSlug}>
                <MinimalTemplate className={`${baseClass}__modal-template`}>
                  <h1>{t('confirmRevertToSaved')}</h1>
                  <p>{t('aboutToRevertToPublished')}</p>
                  <Button
                    buttonStyle="secondary"
                    onClick={processing ? undefined : () => toggleModal(revertModalSlug)}
                    type="button"
                  >
                    {t('general:cancel')}
                  </Button>
                  <Button
                    id="action-revert-to-published-confirm"
                    onClick={processing ? undefined : () => performAction('revert')}
                  >
                    {t(processing ? 'reverting' : 'general:confirm')}
                  </Button>
                </MinimalTemplate>
              </Modal>
            </React.Fragment>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default Status
