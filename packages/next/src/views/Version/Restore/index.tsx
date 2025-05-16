'use client'

import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  ConfirmationModal,
  PopupList,
  toast,
  useConfig,
  useModal,
  useRouteTransition,
  useTranslation,
} from '@payloadcms/ui'
import { requests } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment, useCallback, useState } from 'react'

import type { Props } from './types.js'

import './index.scss'

const baseClass = 'restore-version'
const modalSlug = 'restore-version'

const Restore: React.FC<Props> = ({
  className,
  collectionSlug,
  globalSlug,
  label,
  originalDocID,
  status,
  versionDate,
  versionID,
}) => {
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { toggleModal } = useModal()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const [draft, setDraft] = useState(false)
  const { startRouteTransition } = useRouteTransition()

  const restoreMessage = t('version:aboutToRestoreGlobal', {
    label: getTranslation(label, i18n),
    versionDate,
  })

  let fetchURL = `${serverURL}${apiRoute}`
  let redirectURL: string

  const canRestoreAsDraft = status !== 'draft' && collectionConfig?.versions?.drafts

  if (collectionSlug) {
    fetchURL = `${fetchURL}/${collectionSlug}/versions/${versionID}?draft=${draft}`
    redirectURL = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/${originalDocID}`,
    })
  }

  if (globalSlug) {
    fetchURL = `${fetchURL}/globals/${globalSlug}/versions/${versionID}?draft=${draft}`
    redirectURL = formatAdminURL({
      adminRoute,
      path: `/globals/${globalSlug}`,
    })
  }

  const handleRestore = useCallback(async () => {
    const res = await requests.post(fetchURL, {
      headers: {
        'Accept-Language': i18n.language,
      },
    })

    if (res.status === 200) {
      const json = await res.json()
      toast.success(json.message)
      return startRouteTransition(() => router.push(redirectURL))
    } else {
      toast.error(t('version:problemRestoringVersion'))
    }
  }, [fetchURL, redirectURL, t, i18n, router, startRouteTransition])

  return (
    <Fragment>
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Button
          buttonStyle="pill"
          className={[canRestoreAsDraft && `${baseClass}__button`].filter(Boolean).join(' ')}
          onClick={() => toggleModal(modalSlug)}
          size="small"
          SubMenuPopupContent={
            canRestoreAsDraft
              ? () => (
                  <PopupList.ButtonGroup>
                    <PopupList.Button onClick={() => [setDraft(true), toggleModal(modalSlug)]}>
                      {t('version:restoreAsDraft')}
                    </PopupList.Button>
                  </PopupList.ButtonGroup>
                )
              : null
          }
        >
          {t('version:restoreThisVersion')}
        </Button>
      </div>
      <ConfirmationModal
        body={restoreMessage}
        confirmingLabel={t('version:restoring')}
        heading={t('version:confirmVersionRestoration')}
        modalSlug={modalSlug}
        onConfirm={handleRestore}
      />
    </Fragment>
  )
}

export default Restore
