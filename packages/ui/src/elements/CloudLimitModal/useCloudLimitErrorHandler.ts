'use client'
import { useModal } from '@faceless-ui/modal'
import { hasAutosaveEnabled } from 'payload/shared'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import {
  cloudLimitDocumentCountToastMessageKey,
  cloudLimitErrorCodes,
  cloudLimitToastMessageKeys,
  formatCloudLimitDocumentCountModalSlug,
} from './shared.js'

export function useCloudLimitErrorHandler(): {
  documentCountModalSlug: string
  showCloudLimitError: (code: string) => void
} {
  const { openModal } = useModal()
  const { docConfig } = useDocumentInfo()
  const { t } = useTranslation()
  const editDepth = useEditDepth()

  const documentCountModalSlug = formatCloudLimitDocumentCountModalSlug(editDepth)

  const showCloudLimitError = useCallback(
    (code: string): void => {
      if (code === cloudLimitErrorCodes.documentCount) {
        if (hasAutosaveEnabled(docConfig)) {
          toast.info(t(cloudLimitDocumentCountToastMessageKey))
        } else {
          openModal(documentCountModalSlug)
        }
      } else {
        const messageKey = cloudLimitToastMessageKeys[code]

        if (messageKey) {
          toast.info(t(messageKey))
        }
      }
    },
    [docConfig, openModal, documentCountModalSlug, t],
  )

  return { documentCountModalSlug, showCloudLimitError }
}
