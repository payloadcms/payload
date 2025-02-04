'use client'
import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  ChevronIcon,
  Modal,
  Pill,
  Popup,
  PopupList,
  useConfig,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { formatAdminURL, requests } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import React, { Fragment, useCallback, useState } from 'react'
import { toast } from 'sonner'

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
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const [draft, setDraft] = useState(false)

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
    setProcessing(true)

    const res = await requests.post(fetchURL, {
      headers: {
        'Accept-Language': i18n.language,
      },
    })

    if (res.status === 200) {
      const json = await res.json()
      toast.success(json.message)
      router.push(redirectURL)
    } else {
      toast.error(t('version:problemRestoringVersion'))
    }
  }, [fetchURL, redirectURL, t, i18n, router])
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
      <Modal className={`${baseClass}__modal`} slug={modalSlug}>
        <div className={`${baseClass}__wrapper`}>
          <div className={`${baseClass}__content`}>
            <h1>{t('version:confirmVersionRestoration')}</h1>
            <p>{restoreMessage}</p>
          </div>
          <div className={`${baseClass}__controls`}>
            <Button
              buttonStyle="secondary"
              onClick={processing ? undefined : () => toggleModal(modalSlug)}
              size="large"
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button onClick={processing ? undefined : () => void handleRestore()}>
              {processing ? t('version:restoring') : t('general:confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </Fragment>
  )
}

export default Restore
