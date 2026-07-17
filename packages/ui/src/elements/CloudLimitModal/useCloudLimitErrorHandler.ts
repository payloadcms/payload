'use client'
import { useModal } from '@faceless-ui/modal'
import { hasAutosaveEnabled } from 'payload/shared'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import {
  cloudLimitDocumentCountToastMessage,
  cloudLimitErrorCodes,
  cloudLimitToastMessages,
  formatCloudLimitDocumentCountModalSlug,
} from './shared.js'

export function useCloudLimitErrorHandler(): {
  documentCountModalSlug: string
  showCloudLimitError: (code: string) => void
} {
  const { openModal } = useModal()
  const { docConfig } = useDocumentInfo()
  const editDepth = useEditDepth()

  const documentCountModalSlug = formatCloudLimitDocumentCountModalSlug(editDepth)

  const showCloudLimitError = useCallback(
    (code: string): void => {
      if (code === cloudLimitErrorCodes.documentCount) {
        if (hasAutosaveEnabled(docConfig)) {
          toast.info(cloudLimitDocumentCountToastMessage)
        } else {
          openModal(documentCountModalSlug)
        }
      } else if (cloudLimitToastMessages[code]) {
        toast.info(cloudLimitToastMessages[code])
      }
    },
    [docConfig, openModal, documentCountModalSlug],
  )

  return { documentCountModalSlug, showCloudLimitError }
}
