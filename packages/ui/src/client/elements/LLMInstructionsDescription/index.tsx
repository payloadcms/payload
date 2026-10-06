'use client'

import React from 'react'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

export const LLMInstructionsDescription = ({ isSystem = false }: { isSystem?: boolean }) => {
  const { data } = useDocumentInfo()
  const { t } = useTranslation()
  const isGlobal = data?.entityType === 'global'

  return (
    <p className="llm-instructions__description">
      {isSystem
        ? t(
            isGlobal
              ? 'llmInstructions:globalSystemDescription'
              : 'llmInstructions:collectionSystemDescription',
          )
        : t(
            isGlobal
              ? 'llmInstructions:globalDescription'
              : 'llmInstructions:collectionDescription',
            {
              label: data?.title || '',
            },
          )}
    </p>
  )
}
