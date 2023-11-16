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

const baseClass = 'unpublish-many'

const UnpublishMany: React.FC<Props> = (props) => {
  const { collection: { labels: { plural }, slug, versions } = {}, resetParams } = props

  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { permissions } = useAuth()
  const { toggleModal } = useModal()
  const { i18n, t } = useTranslation('version')
  const { count, getQueryParams, selectAll } = useSelection()
  const [submitted, setSubmitted] = useState(false)

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update?.permission

  const modalSlug = `unpublish-${slug}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const handleUnpublish = useCallback(() => {
    setSubmitted(true)
    requests
      .patch(`${serverURL}${api}/${slug}${getQueryParams({ _status: { not_equals: 'draft' } })}`, {
        body: JSON.stringify({
          _status: 'draft',
        }),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      })
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
        {t('unpublish')}
      </Pill>
      <Modal className={baseClass} slug={modalSlug}>
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmUnpublish')}</h1>
          <p>{t('aboutToUnpublishSelection', { label: getTranslation(plural, i18n) })}</p>
          <Button
            buttonStyle="secondary"
            id="confirm-cancel"
            onClick={submitted ? undefined : () => toggleModal(modalSlug)}
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button id="confirm-unpublish" onClick={submitted ? undefined : handleUnpublish}>
            {submitted ? t('unpublishing') : t('general:confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  )
}

export default UnpublishMany
