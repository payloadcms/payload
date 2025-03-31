'use client'

import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { PopupList } from '../Popup/index.js'

export type Props = {
  readonly id: string
  readonly onDuplicate?: DocumentDrawerContextType['onDuplicate']
  readonly redirectAfterDuplicate?: boolean
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
  readonly slug: string
}

export const DuplicateDocument: React.FC<Props> = ({
  id,
  slug,
  onDuplicate,
  redirectAfterDuplicate = true,
  singularLabel,
}) => {
  const router = useRouter()
  const modified = useFormModified()
  const { openModal } = useModal()
  const locale = useLocale()
  const { setModified } = useForm()
  const { startRouteTransition } = useRouteTransition()

  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: slug })

  const [renderModal, setRenderModal] = React.useState(false)
  const { i18n, t } = useTranslation()

  const modalSlug = `duplicate-${id}`

  const duplicate = useCallback(async () => {
    setRenderModal(true)

    await requests
      .post(
        `${serverURL}${apiRoute}/${slug}/${id}/duplicate${locale?.code ? `?locale=${locale.code}` : ''}`,
        {
          body: JSON.stringify({}),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
            credentials: 'include',
          },
        },
      )
      .then(async (res) => {
        const { doc, errors, message } = await res.json()

        if (res.status < 400) {
          toast.success(
            message ||
              t('general:successfullyDuplicated', { label: getTranslation(singularLabel, i18n) }),
          )

          setModified(false)

          if (redirectAfterDuplicate) {
            return startRouteTransition(() =>
              router.push(
                formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}/${doc.id}${locale?.code ? `?locale=${locale.code}` : ''}`,
                }),
              ),
            )
          }

          if (typeof onDuplicate === 'function') {
            void onDuplicate({ collectionConfig, doc })
          }
        } else {
          toast.error(
            errors?.[0].message ||
              message ||
              t('error:unspecific', { label: getTranslation(singularLabel, i18n) }),
          )
        }
      })
  }, [
    locale,
    serverURL,
    apiRoute,
    slug,
    id,
    i18n,
    t,
    singularLabel,
    onDuplicate,
    redirectAfterDuplicate,
    setModified,
    router,
    adminRoute,
    collectionConfig,
    startRouteTransition,
  ])

  const onConfirm = useCallback(async () => {
    setRenderModal(false)

    await duplicate()
  }, [duplicate])

  return (
    <React.Fragment>
      <PopupList.Button
        id="action-duplicate"
        onClick={() => {
          if (modified) {
            setRenderModal(true)
            return openModal(modalSlug)
          }

          return duplicate()
        }}
      >
        {t('general:duplicate')}
      </PopupList.Button>
      {renderModal && (
        <ConfirmationModal
          body={t('general:unsavedChangesDuplicate')}
          confirmLabel={t('general:duplicateWithoutSaving')}
          heading={t('general:unsavedChanges')}
          modalSlug={modalSlug}
          onConfirm={onConfirm}
        />
      )}
    </React.Fragment>
  )
}
