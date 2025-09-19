'use client'

import { Button, Modal, PopupList, useModal, useTranslation } from '@payloadcms/ui'
import { drawerZBase, useDrawerDepth } from '@payloadcms/ui/elements/Drawer'
import React from 'react'

import './index.scss'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'

export const updateTenantFieldModalSlug = 'update-tenant-field-modal'
const baseClass = 'update-tenant-field-modal'

export const UpdateTenantFieldTrigger: React.FC = () => {
  const { openModal } = useModal()

  return (
    <>
      <PopupList.Button onClick={() => openModal(updateTenantFieldModalSlug)}>
        Change Tenant
      </PopupList.Button>
    </>
  )
}

export const UpdateTenantFieldModal: React.FC<{
  afterModalClose: () => void
  afterModalOpen: () => void
  children: React.ReactNode
  onCancel?: () => void
  onConfirm?: () => void
}> = ({ afterModalClose, afterModalOpen, children, onCancel, onConfirm }) => {
  const editDepth = useDrawerDepth()
  const { t } = useTranslation<PluginMultiTenantTranslations, PluginMultiTenantTranslationKeys>()
  const { closeModal, isModalOpen: isModalOpenFn } = useModal()
  const isModalOpen = isModalOpenFn(updateTenantFieldModalSlug)
  const wasModalOpenRef = React.useRef<boolean>(isModalOpen)

  const onModalConfirm = React.useCallback(() => {
    if (typeof onConfirm === 'function') {
      onConfirm()
    }
    closeModal(updateTenantFieldModalSlug)
  }, [onConfirm, closeModal])

  const onModalCancel = React.useCallback(() => {
    if (typeof onCancel === 'function') {
      onCancel()
    }
    closeModal(updateTenantFieldModalSlug)
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

  return (
    <Modal
      className={baseClass}
      slug={updateTenantFieldModalSlug}
      style={{
        zIndex: drawerZBase + editDepth,
      }}
    >
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h3>{t('plugin-multi-tenant:assign-document-modal-title')}</h3>
          {t('plugin-multi-tenant:assign-document-modal-description')}
          <div className={`${baseClass}__field-wrap`}>{children}</div>
          <div className={`${baseClass}__actions`}>
            <Button buttonStyle="secondary" margin={false} onClick={onModalCancel}>
              {t('general:cancel')}
            </Button>
            <Button buttonStyle="primary" margin={false} onClick={onModalConfirm}>
              {t('general:save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
