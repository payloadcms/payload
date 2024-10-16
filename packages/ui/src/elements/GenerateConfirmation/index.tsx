'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React from 'react'
import { toast } from 'sonner'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

const baseClass = 'generate-confirmation'

export type GenerateConfirmationProps = {
  highlightField: (Boolean) => void
  setKey: () => void
}

export const GenerateConfirmation: React.FC<GenerateConfirmationProps> = (props) => {
  const { highlightField, setKey } = props

  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  const modalSlug = `generate-confirmation-${id}`

  const handleGenerate = () => {
    setKey()
    toggleModal(modalSlug)
    toast.success(t('authentication:newAPIKeyGenerated'))
    highlightField(true)
  }

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        onClick={() => {
          toggleModal(modalSlug)
        }}
        size="small"
      >
        {t('authentication:generateNewAPIKey')}
      </Button>
      <Modal className={baseClass} slug={modalSlug}>
        <div className={`${baseClass}__wrapper`}>
          <div className={`${baseClass}__content`}>
            <h1>{t('authentication:confirmGeneration')}</h1>
            <p>
              <Translation
                elements={{
                  1: ({ children }) => <strong>{children}</strong>,
                }}
                i18nKey="authentication:generatingNewAPIKeyWillInvalidate"
                t={t}
              />
            </p>
          </div>
          <div className={`${baseClass}__controls`}>
            <Button
              buttonStyle="secondary"
              onClick={() => {
                toggleModal(modalSlug)
              }}
              size="large"
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button onClick={handleGenerate}>{t('authentication:generate')}</Button>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  )
}
