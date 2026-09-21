'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '../../../elements/Button/index.js'
import { ConfirmationModal } from '../../../elements/ConfirmationModal/index.js'
import { Translation } from '../../../elements/Translation/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export type APIKeyGenerationModalProps = {
  highlightField: (Boolean) => void
  icon?: React.ReactNode
  id?: string
  setKey: () => boolean | Promise<boolean | void> | void
  willInvalidateExistingKey?: boolean
}

export type GenerateConfirmationProps = APIKeyGenerationModalProps

export function APIKeyGenerationModal(props: APIKeyGenerationModalProps) {
  const { id, highlightField, icon, setKey, willInvalidateExistingKey = true } = props

  const { id: documentID } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  const modalSlug = `generate-confirmation-${documentID}`

  const handleGenerate = useCallback(async () => {
    if ((await setKey()) === false) {
      return
    }

    toast.success(t('authentication:newAPIKeyGenerated'))
    highlightField(true)
  }, [highlightField, setKey, t])

  return (
    <React.Fragment>
      <Button
        aria-label={icon ? t('authentication:generateNewAPIKey') : undefined}
        buttonStyle={icon ? 'none' : 'secondary'}
        className={icon ? 'api-key__regenerate-button' : undefined}
        icon={icon}
        id={id}
        onClick={() => {
          toggleModal(modalSlug)
        }}
        size="small"
      >
        {!icon && t('authentication:generateNewAPIKey')}
      </Button>
      <ConfirmationModal
        body={
          willInvalidateExistingKey ? (
            <Translation
              elements={{
                1: ({ children }) => <strong>{children}</strong>,
              }}
              i18nKey="authentication:generatingNewAPIKeyWillInvalidate"
              t={t}
            />
          ) : (
            <span>
              Are you sure you want to generate an API key for user <strong>{documentID}</strong>?
              This will take effect immediately.
            </span>
          )
        }
        confirmLabel={t('authentication:generate')}
        heading={t('authentication:confirmGeneration')}
        modalSlug={modalSlug}
        onConfirm={handleGenerate}
      />
    </React.Fragment>
  )
}
