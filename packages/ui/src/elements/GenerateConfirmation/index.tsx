'use client'
import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { Translation } from '../Translation/index.js'

export type GenerateConfirmationProps = {
  /**
   * Issues the new key. Awaited by the confirmation dialog, which stays open until it
   * settles - the value it produces can only be shown once.
   */
  onGenerate: () => Promise<void> | void
}

export function GenerateConfirmation({ onGenerate }: GenerateConfirmationProps) {
  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  const modalSlug = `generate-confirmation-${id}`

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        id="generate-api-key"
        onClick={() => {
          toggleModal(modalSlug)
        }}
        size="medium"
      >
        {t('authentication:generateNewAPIKey')}
      </Button>
      <ConfirmationModal
        body={
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="authentication:generatingNewAPIKeyWillInvalidate"
            t={t}
          />
        }
        confirmLabel={t('authentication:generate')}
        heading={t('authentication:confirmGeneration')}
        modalSlug={modalSlug}
        onConfirm={onGenerate}
      />
    </React.Fragment>
  )
}
