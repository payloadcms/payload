'use client'
import type { ClientCollectionConfig, SanitizedCollectionConfig } from 'payload'

import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { Button } from '../Button/index.js'
import { drawerZBase } from '../Drawer/index.js'
import { PopupList } from '../Popup/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

const baseClass = 'delete-document'

export type Props = {
  readonly buttonId?: string
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly id?: string
  readonly onDelete?: DocumentDrawerContextType['onDelete']
  readonly redirectAfterDelete?: boolean
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
  readonly title?: string
  readonly useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}

export const DeleteDocument: React.FC<Props> = (props) => {
  const {
    id,
    buttonId,
    collectionSlug,
    onDelete,
    redirectAfterDelete = true,
    singularLabel,
    title: titleFromProps,
  } = props

  const {
    config: {
      routes: { admin: adminRoute, api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { setModified } = useForm()
  const [deleting, setDeleting] = useState(false)
  const { closeModal, toggleModal } = useModal()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { title } = useDocumentInfo()
  const editDepth = useEditDepth()

  const titleToRender = titleFromProps || title || id

  const modalSlug = `delete-${id}`

  const addDefaultError = useCallback(() => {
    setDeleting(false)
    toast.error(t('error:deletingTitle', { title }))
  }, [t, title])

  useEffect(() => {
    return () => {
      closeModal(modalSlug)
    }
  }, [closeModal, modalSlug])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    setModified(false)

    try {
      await requests
        .delete(`${serverURL}${api}/${collectionSlug}/${id}`, {
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        })
        .then(async (res) => {
          try {
            const json = await res.json()

            if (res.status < 400) {
              setDeleting(false)
              toggleModal(modalSlug)

              toast.success(
                t('general:titleDeleted', { label: getTranslation(singularLabel, i18n), title }) ||
                  json.message,
              )

              if (redirectAfterDelete) {
                return router.push(
                  formatAdminURL({
                    adminRoute,
                    path: `/collections/${collectionSlug}`,
                  }),
                )
              }

              if (typeof onDelete === 'function') {
                await onDelete({ id, collectionConfig })
              }

              toggleModal(modalSlug)

              return
            }

            toggleModal(modalSlug)

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
    } catch (e) {
      addDefaultError()
    }
  }, [
    setModified,
    serverURL,
    api,
    collectionSlug,
    id,
    toggleModal,
    modalSlug,
    t,
    singularLabel,
    i18n,
    title,
    router,
    adminRoute,
    addDefaultError,
    redirectAfterDelete,
    onDelete,
    collectionConfig,
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
        <Modal
          className={baseClass}
          slug={modalSlug}
          style={{
            zIndex: drawerZBase + editDepth,
          }}
        >
          <div className={`${baseClass}__wrapper`}>
            <div className={`${baseClass}__content`}>
              <h1>{t('general:confirmDeletion')}</h1>
              <p>
                <Translation
                  elements={{
                    '1': ({ children }) => <strong>{children}</strong>,
                  }}
                  i18nKey="general:aboutToDelete"
                  t={t}
                  variables={{
                    label: getTranslation(singularLabel, i18n),
                    title: titleToRender,
                  }}
                />
              </p>
            </div>
            <div className={`${baseClass}__controls`}>
              <Button
                buttonStyle="secondary"
                id="confirm-cancel"
                onClick={deleting ? undefined : () => toggleModal(modalSlug)}
                size="large"
                type="button"
              >
                {t('general:cancel')}
              </Button>
              <Button
                id="confirm-delete"
                onClick={() => {
                  if (!deleting) {
                    void handleDelete()
                  }
                }}
                size="large"
              >
                {deleting ? t('general:deleting') : t('general:confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    )
  }

  return null
}
