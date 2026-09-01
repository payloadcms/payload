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
  generate: () => Promise<void>
}

export function GenerateConfirmation(props: GenerateConfirmationProps) {
  const { generate } = props

  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  const modalSlug = `generate-confirmation-${id}`

  const handleGenerate = useCallback(async () => {
    try {
      await generate()
      toast.success(t('authentication:newAPIKeyGenerated'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('general:error'))
    }
  }, [generate, t])

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
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
        onConfirm={handleGenerate}
      />
    </React.Fragment>
  )
}
