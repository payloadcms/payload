'use client'
import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment, useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useDocumentTitle } from '../../providers/DocumentTitle/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { PopupList } from '../Popup/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

const baseClass = 'delete-document'

export type Props = {
  readonly buttonId?: string
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly deleteCurrentLocale?: boolean
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
    deleteCurrentLocale = false,
    onDelete,
    redirectAfterDelete = true,
    singularLabel,
    title: titleFromProps,
  } = props

  const {
    config: {
      localization,
      routes: { admin: adminRoute, api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { getData, reset, setModified } = useForm()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { title } = useDocumentTitle()
  const { startRouteTransition } = useRouteTransition()
  const { openModal } = useModal()
  const { code: localeCode, label: localeLabel } = useLocale()
  const { incrementVersionCount } = useDocumentInfo()
  const initialData = getData()

  const modalSlug = `delete-${deleteCurrentLocale ? 'current-locale-' : ''}${id}`

  const [deletePermanently, setDeletePermanently] = useState(false)

  const addDefaultError = useCallback(() => {
    toast.error(t('error:deletingTitle', { title }))
  }, [t, title])

  const handleDelete = useCallback(async () => {
    setModified(false)

    try {
      let json
      const headers = {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      }
      if (localeLabel && deleteCurrentLocale) {
        const deletedData = Object.keys(initialData).reduce((acc, key) => {
          if (key === 'createdAt') {
            acc[key] = initialData[key]
          } else if (key === '_status') {
            acc[key] = initialData[key]
          } else {
            acc[key] = null
          }
          return acc
        }, {})

        const res = await requests.patch(
          `${serverURL}${api}/${collectionSlug}/${id}?locale=${localeCode}`,
          {
            body: JSON.stringify(deletedData),
            headers,
          },
        )

        json = await res.json()

        if (res.status < 400) {
          toast.success(t('general:deletedInLocale', { locale: getTranslation(localeLabel, i18n) }))
          await reset({
            _status: 'draft',
          })
          incrementVersionCount()
          return
        }
        return
      } else {
        const res =
          deletePermanently || !collectionConfig.trash
            ? await requests.delete(`${serverURL}${api}/${collectionSlug}/${id}`, {
                headers,
              })
            : await requests.patch(`${serverURL}${api}/${collectionSlug}/${id}`, {
                body: JSON.stringify({
                  deletedAt: new Date().toISOString(),
                }),
                headers,
              })

        json = await res.json()

        if (res.status < 400) {
          toast.success(
            t(
              deletePermanently || !collectionConfig.trash
                ? 'general:titleDeleted'
                : 'general:titleTrashed',
              {
                label: getTranslation(singularLabel, i18n),
                title,
              },
            ) || json.message,
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

          return
        }
      }

      if (json.errors) {
        json.errors.forEach((error) => toast.error(error.message))
      } else {
        addDefaultError()
      }

      return
    } catch (_err) {
      return addDefaultError()
    }
  }, [
    deletePermanently,
    setModified,
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
    deleteCurrentLocale,
    incrementVersionCount,
    initialData,
    reset,
    localeCode,
    localeLabel,
  ])

  const idToRender = (children) =>
    localization && deleteCurrentLocale ? (
      <>
        <strong>{children}</strong> {t('general:in')}{' '}
        <strong>{getTranslation(localeLabel, i18n)}</strong>
      </>
    ) : (
      <strong>{children}</strong>
    )

  if (id) {
    return (
      <Fragment>
        <PopupList.Button
          id={buttonId}
          onClick={() => {
            openModal(modalSlug)
          }}
        >
          {localeLabel && deleteCurrentLocale ? (
            <>
              {t('general:delete')} {t('general:in')} {getTranslation(localeLabel, i18n)}
            </>
          ) : (
            t('general:delete')
          )}
        </PopupList.Button>
        <ConfirmationModal
          body={
            <Fragment>
              <Translation
                elements={{
                  '1': ({ children }) => idToRender(children),
                }}
                i18nKey={collectionConfig.trash ? 'general:aboutToTrash' : 'general:aboutToDelete'}
                t={t}
                variables={{
                  label: getTranslation(singularLabel, i18n),
                  title: titleFromProps || title || id,
                }}
              />
              {collectionConfig.trash && !deleteCurrentLocale && (
                <div className={`${baseClass}__checkbox`}>
                  <CheckboxInput
                    checked={deletePermanently}
                    id="delete-forever"
                    label={t('general:deletePermanently')}
                    name="delete-forever"
                    onToggle={(e) => setDeletePermanently(e.target.checked)}
                  />
                </div>
              )}
            </Fragment>
          }
          className={baseClass}
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
