'use client'
import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import type { HandleConfirmationAction } from '../ConfirmationModal/index.js'
import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { PopupList } from '../Popup/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

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
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { title } = useDocumentInfo()
  const { startRouteTransition } = useRouteTransition()
  const { openModal } = useModal()

  const titleToRender = titleFromProps || title || id

  const modalSlug = `delete-${id}`

  const handleDelete: HandleConfirmationAction = useCallback(
    async ({ closeConfirmationModal, setPerformingConfirmationAction }) => {
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
                setPerformingConfirmationAction(false)
                closeConfirmationModal()

                toast.success(
                  t('general:titleDeleted', {
                    label: getTranslation(singularLabel, i18n),
                    title,
                  }) || json.message,
                )

                if (redirectAfterDelete) {
                  return startRouteTransition(() =>
                    router.push(
                      formatAdminURL({
                        adminRoute,
                        path: `/collections/${collectionSlug}`,
                      }),
                    ),
                  )
                }

                if (typeof onDelete === 'function') {
                  await onDelete({ id, collectionConfig })
                }

                closeConfirmationModal()

                return
              }

              closeConfirmationModal()

              if (json.errors) {
                json.errors.forEach((error) => toast.error(error.message))
              } else {
                setPerformingConfirmationAction(false)
                toast.error(t('error:deletingTitle', { title }))
              }
              return false
            } catch (_err) {
              setPerformingConfirmationAction(false)
              toast.error(t('error:deletingTitle', { title }))
              return
            }
          })
      } catch (_err) {
        setPerformingConfirmationAction(false)
        toast.error(t('error:deletingTitle', { title }))
      }
    },
    [
      setModified,
      serverURL,
      api,
      collectionSlug,
      id,
      t,
      singularLabel,
      i18n,
      title,
      router,
      adminRoute,
      redirectAfterDelete,
      onDelete,
      collectionConfig,
      startRouteTransition,
    ],
  )

  if (id) {
    return (
      <React.Fragment>
        <PopupList.Button
          id={buttonId}
          onClick={() => {
            openModal(modalSlug)
          }}
        >
          {t('general:delete')}
        </PopupList.Button>
        <ConfirmationModal
          actionLabel={t('general:deleting')}
          body={
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
          }
          handleAction={handleDelete}
          heading={t('general:confirmDeletion')}
          modalSlug={modalSlug}
        />
      </React.Fragment>
    )
  }

  return null
}
