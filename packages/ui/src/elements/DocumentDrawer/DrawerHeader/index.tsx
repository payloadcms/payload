'use client'

import { useCallback, useEffect } from 'react'

import { useModal } from '../../../elements/Modal/index.js'
import { RenderTitle } from '../../../elements/RenderTitle/index.js'
import { useFormModified } from '../../../forms/Form/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { IDLabel } from '../../IDLabel/index.js'
import { LeaveWithoutSavingModal } from '../../LeaveWithoutSaving/index.js'
import { documentDrawerBaseClass } from '../index.js'
import './index.css'

const leaveWithoutSavingModalSlug = 'leave-without-saving-doc-drawer'

export const DocumentDrawerHeader: React.FC<{
  AfterHeader?: React.ReactNode
  drawerSlug: string
  showDocumentID?: boolean
}> = ({ AfterHeader, drawerSlug, showDocumentID = true }) => {
  const { closeModal, isModalOpen, openModal } = useModal()
  const { t } = useTranslation()
  const isModified = useFormModified()

  const handleOnClose = useCallback(() => {
    if (isModified) {
      openModal(leaveWithoutSavingModalSlug)
    } else {
      closeModal(drawerSlug)
    }
  }, [isModified, openModal, closeModal, drawerSlug])

  useEffect(() => {
    if (!isModified) {
      return
    }

    const drawerCloseButton = document.getElementById(`close-drawer__${drawerSlug}`)

    const handleDrawerCloseClick = (event: MouseEvent) => {
      if (isModalOpen(leaveWithoutSavingModalSlug)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      handleOnClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isModalOpen(leaveWithoutSavingModalSlug)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      handleOnClose()
    }

    drawerCloseButton?.addEventListener('click', handleDrawerCloseClick, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      drawerCloseButton?.removeEventListener('click', handleDrawerCloseClick, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [drawerSlug, handleOnClose, isModalOpen, isModified])

  return (
    <div className={`${documentDrawerBaseClass}__header`}>
      <div className={`${documentDrawerBaseClass}__header-content`}>
        <Button
          aria-label={t('general:close')}
          buttonStyle="ghost"
          className={`${documentDrawerBaseClass}__header-close`}
          icon={<ChevronIcon direction="left" size={24} />}
          onClick={handleOnClose}
        />
        <h2 className={`${documentDrawerBaseClass}__header-text`}>
          {<RenderTitle element="span" />}
        </h2>
      </div>
      {showDocumentID && <DocumentID />}
      {AfterHeader ? (
        <div className={`${documentDrawerBaseClass}__after-header`}>{AfterHeader}</div>
      ) : null}

      <LeaveWithoutSavingModal
        modalSlug={leaveWithoutSavingModalSlug}
        onConfirm={() => closeModal(drawerSlug)}
      />
    </div>
  )
}

const DocumentID: React.FC = () => {
  const { id } = useDocumentInfo()
  const { title } = useDocumentTitle()
  return id && id !== title ? <IDLabel id={id.toString()} /> : null
}
