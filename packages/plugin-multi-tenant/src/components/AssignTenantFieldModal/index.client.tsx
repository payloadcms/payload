'use client'

import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  DialogBody,
  DialogCancel,
  DialogConfirm,
  DialogFooter,
  DialogHeader,
  DialogModal,
  Pill,
  PopupList,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'

export const assignTenantModalSlug = 'assign-tenant-field-modal'

export const AssignTenantFieldTrigger: React.FC = () => {
  const { openModal } = useModal()
  const { t } = useTranslation<PluginMultiTenantTranslations, PluginMultiTenantTranslationKeys>()
  const { options } = useTenantSelection()

  if (options.length <= 1) {
    return null
  }

  return (
    <PopupList.Button onClick={() => openModal(assignTenantModalSlug)}>
      {t('plugin-multi-tenant:assign-tenant-button-label')}
    </PopupList.Button>
  )
}

export const AssignTenantFieldModal: React.FC<{
  afterModalClose: () => void
  afterModalOpen: () => void
  children: React.ReactNode
  onCancel?: () => void
  onConfirm?: () => void
}> = ({ afterModalClose, afterModalOpen, children, onCancel, onConfirm }) => {
  const { i18n, t } = useTranslation<
    PluginMultiTenantTranslations,
    PluginMultiTenantTranslationKeys
  >()
  const { collectionSlug } = useDocumentInfo()
  const { title } = useDocumentTitle()
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig
  const { isModalOpen: isModalOpenFn } = useModal()
  const isModalOpen = isModalOpenFn(assignTenantModalSlug)
  const wasModalOpenRef = React.useRef<boolean>(isModalOpen)

  React.useEffect(() => {
    if (wasModalOpenRef.current && !isModalOpen) {
      afterModalClose?.()
    }
    if (!wasModalOpenRef.current && isModalOpen) {
      afterModalOpen?.()
    }
    wasModalOpenRef.current = isModalOpen
  }, [isModalOpen, afterModalClose, afterModalOpen])

  if (!collectionConfig) {
    return null
  }

  return (
    <DialogModal size="medium" slug={assignTenantModalSlug}>
      <DialogHeader title={t('plugin-multi-tenant:assign-tenant-modal-title', { title })}>
        <Pill size="small">{getTranslation(collectionConfig.labels.singular, i18n)}</Pill>
      </DialogHeader>
      <DialogBody>{children}</DialogBody>
      <DialogFooter>
        <DialogCancel onClick={onCancel} />
        <DialogConfirm onClick={() => onConfirm?.()} />
      </DialogFooter>
    </DialogModal>
  )
}
