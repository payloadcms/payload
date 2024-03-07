'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useState } from 'react'
import { toast } from 'react-toastify'

import type { Props } from './types.d.ts'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { SelectAllStatus, useSelection } from '../../providers/SelectionProvider/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import Pill from '../Pill/index.js'
import './index.scss'

const baseClass = 'delete-documents'

export const DeleteMany: React.FC<Props> = (props) => {
  const { collection: { slug, labels: { plural } } = {} } = props

  const { permissions } = useAuth()
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { toggleModal } = useModal()
  const { count, getQueryParams, selectAll, toggleAll } = useSelection()
  const { i18n, t } = useTranslation()
  const [deleting, setDeleting] = useState(false)
  const { dispatchSearchParams } = useSearchParams()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasDeletePermission = collectionPermissions?.delete?.permission

  const modalSlug = `delete-${slug}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    await requests
      .delete(`${serverURL}${api}/${slug}${getQueryParams()}`, {
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
            toast.success(json.message || t('general:deletedSuccessfully'), { autoClose: 3000 })
            toggleAll()
            dispatchSearchParams({
              type: 'SET',
              browserHistory: 'replace',
              params: { page: selectAll ? '1' : undefined },
            })
            return null
          }

          if (json.errors) {
            toast.error(json.message)
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
    dispatchSearchParams,
    getQueryParams,
    i18n.language,
    modalSlug,
    selectAll,
    serverURL,
    slug,
    t,
    toggleAll,
    toggleModal,
  ])

  if (selectAll === SelectAllStatus.None || !hasDeletePermission) {
    return null
  }

  return (
    <React.Fragment>
      <Pill
        className={`${baseClass}__toggle`}
        onClick={() => {
          setDeleting(false)
          toggleModal(modalSlug)
        }}
      >
        {t('general:delete')}
      </Pill>
      <Modal className={baseClass} slug={modalSlug}>
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('general:confirmDeletion')}</h1>
          <p>{t('general:aboutToDeleteCount', { count, label: getTranslation(plural, i18n) })}</p>
          <Button
            buttonStyle="secondary"
            id="confirm-cancel"
            onClick={deleting ? undefined : () => toggleModal(modalSlug)}
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button id="confirm-delete" onClick={deleting ? undefined : handleDelete}>
            {deleting ? t('general:deleting') : t('general:confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  )
}

export default DeleteMany
