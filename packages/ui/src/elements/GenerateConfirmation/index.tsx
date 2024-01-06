import { Modal, useModal } from '@faceless-ui/modal'
import React from 'react'
import { useTranslation } from '../../providers/Translation'
import { toast } from 'react-toastify'

import type { Props } from './types'

import { MinimalTemplate } from '../../templates/Minimal'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { Button } from '../Button'
import './index.scss'

const baseClass = 'generate-confirmation'

const GenerateConfirmation: React.FC<Props> = (props) => {
  const { highlightField, setKey } = props

  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  const modalSlug = `generate-confirmation-${id}`

  const handleGenerate = () => {
    setKey()
    toggleModal(modalSlug)
    toast.success(t('authentication:newAPIKeyGenerated'), { autoClose: 3000 })
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
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('authentication:confirmGeneration')}</h1>
          <p>
            <strong>{t('authentication:generatingNewAPIKeyWillInvalidate')}</strong>
            {/* <Trans i18nKey="generatingNewAPIKeyWillInvalidate" t={t}>
              generatingNewAPIKeyWillInvalidate
              <strong>invalidate</strong>
            </Trans> */}
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
          <Button onClick={handleGenerate}>{t('authentication:generate')}</Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  )
}

export default GenerateConfirmation
