'use client'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Client component imports from same package's client bundle
import { Modal, PopupList, useModal } from '../../exports/client/index.js'
import { CopyButton } from './CopyButton.js'
import { formatForClipboard } from './formatForClipboard.js'
import { VersionList } from './VersionList.js'
import './index.scss'

const baseClass = 'payload-version-menu-item'
const modalSlug = 'payload-version-info'

export const PayloadVersionModalTrigger: React.FC<{
  versions: Record<string, string>
}> = ({ versions }) => {
  const { closeModal, isModalOpen, openModal } = useModal()
  const payloadVersion = versions.payload ?? '0.0.0'

  return (
    <PopupList.ButtonGroup>
      <PopupList.Button className={`${baseClass}__button`} onClick={() => openModal(modalSlug)}>
        {`Payload v${payloadVersion}`}
      </PopupList.Button>
      {isModalOpen(modalSlug) && (
        <Modal className={baseClass} closeOnBlur={false} slug={modalSlug}>
          <div className={`${baseClass}__wrapper`}>
            <div className={`${baseClass}__header`}>
              <h2>Payload Version Info</h2>
              <button
                aria-label="Close"
                className={`${baseClass}__close`}
                onClick={() => closeModal(modalSlug)}
                type="button"
              >
                ×
              </button>
            </div>
            <VersionList versions={versions} />
            <div className={`${baseClass}__controls`}>
              <CopyButton text={formatForClipboard(versions)} />
            </div>
          </div>
        </Modal>
      )}
    </PopupList.ButtonGroup>
  )
}
