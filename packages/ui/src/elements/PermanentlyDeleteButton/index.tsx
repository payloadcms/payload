'use client'

import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useConfig } from '../../providers/Config/index.js'
import { useDocumentTitle } from '../../providers/DocumentTitle/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { Translation } from '../Translation/index.js'

export type Props = {
  readonly buttonId?: string
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly id?: string
  readonly onDelete?: DocumentDrawerContextType['onDelete']
  readonly redirectAfterDelete?: boolean
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
  readonly title?: string
}

export const PermanentlyDeleteButton: React.FC<Props> = (props) => {
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
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { title } = useDocumentTitle()
  const { startRouteTransition } = useRouteTransition()
  const { openModal } = useModal()

  const modalSlug = `perma-delete-${id}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:deletingTitle', { title }))
  }, [t, title])

  const handleDelete = useCallback(async () => {
    try {
      const url = `${serverURL}${api}/${collectionSlug}?${qs.stringify({
        trash: true,
        where: {
          and: [{ id: { equals: id } }, { deletedAt: { exists: true } }],
        },
      })}`

      const res = await requests.delete(url, {
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()

      if (res.status < 400) {
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
                path: `/collections/${collectionSlug}/trash`,
              }),
            ),
          )
        }

        if (typeof onDelete === 'function') {
          await onDelete({ id, collectionConfig })
        }

        return
      }

      if (json.errors) {
        json.errors.forEach((error) => toast.error(error.message))
      } else {
        addDefaultError()
      }
    } catch (_err) {
      addDefaultError()
    }
  }, [
    serverURL,
    api,
    collectionSlug,
    id,
    t,
    singularLabel,
    addDefaultError,
    i18n,
    title,
    router,
    adminRoute,
    redirectAfterDelete,
    onDelete,
    collectionConfig,
    startRouteTransition,
  ])

  if (id) {
    return (
      <Fragment>
        <Button
          buttonStyle="secondary"
          id={buttonId}
          onClick={() => {
            openModal(modalSlug)
          }}
        >
          {t('general:permanentlyDelete')}
        </Button>
        <ConfirmationModal
          body={
            <Translation
              elements={{
                '1': ({ children }) => <strong>{children}</strong>,
              }}
              i18nKey="general:aboutToPermanentlyDelete"
              t={t}
              variables={{
                label: getTranslation(singularLabel, i18n),
                title: titleFromProps || title || id,
              }}
            />
          }
          confirmingLabel={t('general:deleting')}
          heading={t('general:confirmDeletion')}
          modalSlug={modalSlug}
          onConfirm={handleDelete}
        />
      </Fragment>
    )
  }

  return null
}
