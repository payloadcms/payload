'use client'

import {
  Button,
  ConfirmationModal,
  Translation,
  useDocumentInfo,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import type { PluginMCPTranslationKeys, PluginMCPTranslations } from '../../translations/index.js'

export type RotateConfirmationProps = {
  className?: string
  disabled?: boolean
  onRotate: () => Promise<void>
}

export const RotateConfirmation: React.FC<RotateConfirmationProps> = ({
  className,
  disabled,
  onRotate,
}) => {
  const { id } = useDocumentInfo()
  const { toggleModal } = useModal()
  const { t } = useTranslation<PluginMCPTranslations, PluginMCPTranslationKeys>()
  const [isLoading, setIsLoading] = useState(false)

  const modalSlug = `rotate-confirmation-${id}`

  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    try {
      await onRotate()
    } finally {
      setIsLoading(false)
    }
  }, [onRotate])

  return (
    <>
      <Button
        buttonStyle="secondary"
        className={className}
        disabled={disabled || isLoading}
        onClick={() => {
          toggleModal(modalSlug)
        }}
        size="medium"
      >
        {t('plugin-mcp:rotateAPIKey')}
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
        confirmLabel={t('plugin-mcp:rotate')}
        heading={t('plugin-mcp:confirmRotation')}
        modalSlug={modalSlug}
        onConfirm={handleConfirm}
      />
    </>
  )
}
