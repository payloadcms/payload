import { Modal, useModal } from '@faceless-ui/modal'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import type { Props } from './types'

import MinimalTemplate from '../../templates/Minimal'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import Button from '../Button'
import './index.scss'

const baseClass = 'generate-confirmation'

const GenerateConfirmation: React.FC<Props> = (props) => {
  const { highlightField, setKey } = props

  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation('authentication')

  const modalSlug = `generate-confirmation-${id}`

  const handleGenerate = () => {
    setKey()
    toggleModal(modalSlug)
    toast.success(t('newAPIKeyGenerated'), { autoClose: 3000 })
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
        {t('generateNewAPIKey')}
      </Button>
      <Modal className={baseClass} slug={modalSlug}>
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmGeneration')}</h1>
          <p>
            <Trans i18nKey="generatingNewAPIKeyWillInvalidate" t={t}>
              generatingNewAPIKeyWillInvalidate
              <strong>invalidate</strong>
            </Trans>
          </p>

          <Button
            buttonStyle="secondary"
            onClick={() => {
              toggleModal(modalSlug)
            }}
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button onClick={handleGenerate}>{t('generate')}</Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  )
}

export default GenerateConfirmation
