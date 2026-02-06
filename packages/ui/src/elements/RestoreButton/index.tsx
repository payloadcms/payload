'use client'

import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentTitle } from '../../providers/DocumentTitle/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

const baseClass = 'restore-button'

export type Props = {
  readonly buttonId?: string
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly id?: string
  readonly onRestore?: DocumentDrawerContextType['onRestore']
  readonly redirectAfterRestore?: boolean
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
  readonly title?: string
}

export const RestoreButton: React.FC<Props> = (props) => {
  const {
    id,
    buttonId,
    collectionSlug,
    onRestore,
    redirectAfterRestore = true,
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

  const modalSlug = `restore-${id}`

  const [restoreAsPublished, setRestoreAsPublished] = useState(false)

  const addDefaultError = useCallback(() => {
    toast.error(t('error:restoringTitle', { title }))
  }, [t, title])

  const handleRestore = useCallback(async () => {
    try {
      const url = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}${qs.stringify(
          {
            trash: true,
            where: {
              and: [{ id: { equals: id } }, { deletedAt: { exists: true } }],
            },
          },
          {
            addQueryPrefix: true,
          },
        )}`,
      })

      const body: Record<string, unknown> = {
        deletedAt: null,
      }

      // Only include _status if drafts are enabled
      if (collectionConfig?.versions?.drafts) {
        body._status = restoreAsPublished ? 'published' : 'draft'
      }

      const res = await requests.patch(url, {
        body: JSON.stringify(body),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()

      if (res.status < 400) {
        toast.success(
          t('general:titleRestored', {
            label: getTranslation(singularLabel, i18n),
            title,
          }) || json.message,
        )

        if (redirectAfterRestore) {
          return startRouteTransition(() =>
            router.push(
              formatAdminURL({
                adminRoute,
                path: `/collections/${collectionSlug}/${id}`,
                serverURL,
              }),
            ),
          )
        }

        if (typeof onRestore === 'function') {
          await onRestore({ id, collectionConfig })
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
    redirectAfterRestore,
    onRestore,
    collectionConfig,
    startRouteTransition,
    restoreAsPublished,
  ])

  if (id) {
    return (
      <Fragment>
        <Button
          buttonStyle="primary"
          id={buttonId}
          key={buttonId}
          onClick={() => {
            openModal(modalSlug)
          }}
        >
          {t('general:restore')}
        </Button>
        <ConfirmationModal
          body={
            <Fragment>
              <Translation
                elements={{
                  '1': ({ children }) => <strong>{children}</strong>,
                }}
                i18nKey={
                  collectionConfig?.versions?.drafts
                    ? 'general:aboutToRestoreAsDraft'
                    : 'general:aboutToRestore'
                }
                t={t}
                variables={{
                  label: getTranslation(singularLabel, i18n),
                  title: titleFromProps || title || id,
                }}
              />
              {collectionConfig?.versions?.drafts && (
                <div className={`${baseClass}__checkbox`}>
                  <CheckboxInput
                    checked={restoreAsPublished}
                    id="restore-as-published"
                    label={t('general:restoreAsPublished')}
                    name="restore-as-published"
                    onToggle={(e) => setRestoreAsPublished(e.target.checked)}
                  />
                </div>
              )}
            </Fragment>
          }
          className={baseClass}
          confirmingLabel={t('general:restoring')}
          heading={t('general:confirmRestoration')}
          modalSlug={modalSlug}
          onConfirm={handleRestore}
        />
      </Fragment>
    )
  }

  return null
}
