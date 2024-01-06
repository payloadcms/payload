'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { toast } from 'react-toastify'

import type { Props } from './types'

import { getTranslation } from 'payload/utilities'
// import { requests } from '../../../api'
import useTitle from '../../hooks/useTitle'
import { useForm } from '../../forms/Form/context'
import { MinimalTemplate } from '../../templates/Minimal'
import { useTranslation } from '../../providers/Translation'
import { useConfig } from '../../providers/Config'
import { Button } from '../Button'
import * as PopupList from '../Popup/PopupButtonList'
import './index.scss'

const baseClass = 'delete-document'

const DeleteDocument: React.FC<Props> = (props) => {
  const {
    id,
    buttonId,
    collection: { labels: { singular } = {}, slug } = {},
    collection,
    title: titleFromProps,
  } = props

  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()

  const { setModified } = useForm()
  const [deleting, setDeleting] = useState(false)
  const { toggleModal } = useModal()
  const history = useHistory()
  const { i18n, t } = useTranslation()
  const title = useTitle({ useAsTitle: collection?.admin?.useAsTitle })
  const titleToRender = titleFromProps || title || id

  const modalSlug = `delete-${id}`

  const addDefaultError = useCallback(() => {
    setDeleting(false)
    toast.error(t('error:deletingTitle', { title }))
  }, [t, title])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    setModified(false)
    try {
      // await requests
      //   .delete(`${serverURL}${api}/${slug}/${id}`, {
      //     headers: {
      //       'Accept-Language': i18n.language,
      //       'Content-Type': 'application/json',
      //     },
      //   })
      //   .then(async (res) => {
      //     try {
      //       const json = await res.json()
      //       if (res.status < 400) {
      //         setDeleting(false)
      //         toggleModal(modalSlug)
      //         toast.success(t('general:titleDeleted', { label: getTranslation(singular, i18n), title }))
      //         return history.push(`${admin}/collections/${slug}`)
      //       }
      //       toggleModal(modalSlug)
      //       if (json.errors) {
      //         json.errors.forEach((error) => toast.error(error.message))
      //       } else {
      //         addDefaultError()
      //       }
      //       return false
      //     } catch (e) {
      //       return addDefaultError()
      //     }
      //   })
    } catch (e) {
      addDefaultError()
    }
  }, [
    setModified,
    serverURL,
    api,
    slug,
    id,
    toggleModal,
    modalSlug,
    t,
    singular,
    i18n,
    title,
    history,
    admin,
    addDefaultError,
  ])

  if (id) {
    return (
      <React.Fragment>
        <PopupList.Button
          id={buttonId}
          onClick={() => {
            setDeleting(false)
            toggleModal(modalSlug)
          }}
        >
          {t('general:delete')}
        </PopupList.Button>
        <Modal className={baseClass} slug={modalSlug}>
          <MinimalTemplate className={`${baseClass}__template`}>
            <h1>{t('general:confirmDeletion')}</h1>
            <p>
              {t('general:aboutToDelete', {
                label: getTranslation(singular, i18n),
                title: titleToRender,
              })}
              {/* <Trans
                i18nKey="aboutToDelete"
                t={t}
                values={{ label: getTranslation(singular, i18n), title: titleToRender }}
              >
                aboutToDelete
                <strong>{titleToRender}</strong>
              </Trans> */}
            </p>
            <div className={`${baseClass}__actions`}>
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
            </div>
          </MinimalTemplate>
        </Modal>
      </React.Fragment>
    )
  }

  return null
}

export default DeleteDocument
