import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { requests } from '../../../api'
import MinimalTemplate from '../../templates/Minimal'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider'
import Button from '../Button'
import Pill from '../Pill'
import './index.scss'

const baseClass = 'publish-many'

const PublishMany: React.FC<Props> = (props) => {
  const { collection: { slug, labels: { plural }, versions } = {}, resetParams } = props

  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { permissions } = useAuth()
  const { toggleModal } = useModal()
  const { i18n, t } = useTranslation('version')
  const { getQueryParams, selectAll } = useSelection()
  const [submitted, setSubmitted] = useState(false)

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update?.permission

  const modalSlug = `publish-${slug}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const handlePublish = useCallback(() => {
    setSubmitted(true)
    void requests
      .patch(
        `${serverURL}${api}/${slug}${getQueryParams({
          _status: { not_equals: 'published' },
        })}&draft=true`,
        {
          body: JSON.stringify({
            _status: 'published',
          }),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(async (res) => {
        try {
          const json = await res.json()
          toggleModal(modalSlug)
          if (res.status < 400) {
            toast.success(t('general:updatedSuccessfully'))
            resetParams({ page: selectAll ? 1 : undefined })
            return null
          }

          if (json.errors) {
            json.errors.forEach((error) => toast.error(error.message))
          } else {
            addDefaultError()
          }
          return false
        } catch (e) {
          return addDefaultError()
        }
      })
  }, [
    addDefaultError,
    api,
    getQueryParams,
    i18n.language,
    modalSlug,
    resetParams,
    selectAll,
    serverURL,
    slug,
    t,
    toggleModal,
  ])

  if (!versions?.drafts || selectAll === SelectAllStatus.None || !hasPermission) {
    return null
  }

  return (
    <React.Fragment>
      <Pill
        className={`${baseClass}__toggle`}
        onClick={() => {
          setSubmitted(false)
          toggleModal(modalSlug)
        }}
      >
        {t('publish')}
      </Pill>
      <Modal className={baseClass} slug={modalSlug}>
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmPublish')}</h1>
          <p>{t('aboutToPublishSelection', { label: getTranslation(plural, i18n) })}</p>
          <Button
            buttonStyle="secondary"
            id="confirm-cancel"
            onClick={submitted ? undefined : () => toggleModal(modalSlug)}
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button id="confirm-publish" onClick={submitted ? undefined : handlePublish}>
            {submitted ? t('publishing') : t('general:confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  )
}

export default PublishMany
