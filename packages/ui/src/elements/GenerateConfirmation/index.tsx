'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { Translation } from '../Translation/index.js'

export type GenerateConfirmationProps = {
  highlightField: (Boolean) => void
  setKey: () => void
}

export function GenerateConfirmation(props: GenerateConfirmationProps) {
  const { highlightField, setKey } = props

  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  const modalSlug = `generate-confirmation-${id}`

  const handleGenerate = useCallback(() => {
    setKey()
    toast.success(t('authentication:newAPIKeyGenerated'))
    highlightField(true)
  }, [highlightField, setKey, t])

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
        onConfirm={handleGenerate}
      />
    </React.Fragment>
  )
}
