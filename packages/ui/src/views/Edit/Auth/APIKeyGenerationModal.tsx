'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '../../../elements/Button/index.js'
import { ConfirmationModal } from '../../../elements/ConfirmationModal/index.js'
import { Translation } from '../../../elements/Translation/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

type APIKeyGenerationModalProps = {
  apiKeyLast4?: string
  highlightField: () => void
  icon?: React.ReactNode
  id?: string
  setKey: () => boolean | Promise<boolean | void> | void
  willInvalidateExistingKey?: boolean
}

export function APIKeyGenerationModal({
  id,
  apiKeyLast4,
  highlightField,
  icon,
  setKey,
  willInvalidateExistingKey = true,
}: APIKeyGenerationModalProps) {
  const { id: documentID } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()
  const modalSlug = `generate-confirmation-${documentID}`
  const handleGenerate = useCallback(async () => {
    if ((await setKey()) === false) {
      return
    }
    toast.success(t('authentication:newAPIKeyGenerated'))
    highlightField()
  }, [highlightField, setKey, t])

  return (
    <React.Fragment>
      <Button
        aria-label={icon ? t('authentication:generateNewAPIKey') : undefined}
        buttonStyle={icon ? 'ghost' : 'secondary'}
        className={icon ? 'api-key__regenerate-button' : undefined}
        icon={icon}
        id={id}
        onClick={() => toggleModal(modalSlug)}
        size="medium"
      >
        {!icon && t('authentication:generateNewAPIKey')}
      </Button>
      <ConfirmationModal
        body={
          willInvalidateExistingKey && apiKeyLast4 ? (
            <span>
              Generating a new API key will invalidate the key ending in{' '}
              <strong>{apiKeyLast4}</strong>. This will take effect immediately.
            </span>
          ) : willInvalidateExistingKey ? (
            <Translation
              elements={{ 1: ({ children }) => <strong>{children}</strong> }}
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
