'use client'

import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  Modal,
  Pill,
  PopupList,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { drawerZBase, useDrawerDepth } from '@payloadcms/ui/elements/Drawer'
import React from 'react'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.scss'

export const assignTenantModalSlug = 'assign-tenant-field-modal'
const baseClass = 'assign-tenant-field-modal'

export const AssignTenantFieldTrigger: React.FC = () => {
  const { openModal } = useModal()
  const { t } = useTranslation<PluginMultiTenantTranslations, PluginMultiTenantTranslationKeys>()
  const { options } = useTenantSelection()

  if (options.length <= 1) {
    return null
  }

  return (
    <>
      <PopupList.Button onClick={() => openModal(assignTenantModalSlug)}>
        {t('plugin-multi-tenant:assign-tenant-button-label')}
      </PopupList.Button>
    </>
  )
}

export const AssignTenantFieldModal: React.FC<{
  afterModalClose: () => void
  afterModalOpen: () => void
  children: React.ReactNode
  onCancel?: () => void
  onConfirm?: () => void
}> = ({ afterModalClose, afterModalOpen, children, onCancel, onConfirm }) => {
  const editDepth = useDrawerDepth()
  const { i18n, t } = useTranslation<
    PluginMultiTenantTranslations,
    PluginMultiTenantTranslationKeys
  >()
  const { collectionSlug } = useDocumentInfo()
  const { title } = useDocumentTitle()
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig
  const { closeModal, isModalOpen: isModalOpenFn } = useModal()
  const isModalOpen = isModalOpenFn(assignTenantModalSlug)
  const wasModalOpenRef = React.useRef<boolean>(isModalOpen)

  const onModalConfirm = React.useCallback(() => {
    if (typeof onConfirm === 'function') {
      onConfirm()
    }
    closeModal(assignTenantModalSlug)
  }, [onConfirm, closeModal])

  const onModalCancel = React.useCallback(() => {
    if (typeof onCancel === 'function') {
      onCancel()
    }
    closeModal(assignTenantModalSlug)
  }, [onCancel, closeModal])

  React.useEffect(() => {
    if (wasModalOpenRef.current && !isModalOpen) {
      // modal was open, and now is closed
      if (typeof afterModalClose === 'function') {
        afterModalClose()
      }
    }

    if (!wasModalOpenRef.current && isModalOpen) {
      // modal was closed, and now is open
      if (typeof afterModalOpen === 'function') {
        afterModalOpen()
      }
    }
    wasModalOpenRef.current = isModalOpen
  }, [isModalOpen, onCancel, afterModalClose, afterModalOpen])

  if (!collectionConfig) {
    return null
  }

  return (
    <Modal
      className={baseClass}
      slug={assignTenantModalSlug}
      style={{
        zIndex: drawerZBase + editDepth,
      }}
    >
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__header`}>
          <h3>
            {t('plugin-multi-tenant:assign-tenant-modal-title', {
              title,
            })}
          </h3>
          <Pill className={`${baseClass}__collection-pill`} size="small">
            {getTranslation(collectionConfig.labels.singular, i18n)}
          </Pill>
        </div>
        <div className={`${baseClass}__content`}>{children}</div>
        <div className={`${baseClass}__actions`}>
          <Button buttonStyle="secondary" margin={false} onClick={onModalCancel}>
            {t('general:cancel')}
          </Button>
          <Button margin={false} onClick={onModalConfirm}>
            {t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
