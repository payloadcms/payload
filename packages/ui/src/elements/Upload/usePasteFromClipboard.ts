'use client'
import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { validateMimeType } from 'payload/shared'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadControls } from '../../providers/UploadControls/index.js'
import { getFileOrUrlFromClipboard } from '../../utilities/getFilesFromClipboard.js'
import { pasteURLDrawerSlug } from './UploadFromURLModal/index.js'

type UsePasteFromClipboardArgs = {
  readonly handleFileSelection: (files: FileList) => void
  readonly handleUrlSubmit: (urlOverride?: string) => Promise<boolean>
  readonly setFileUrl: (url: string) => void
  readonly uploadConfig: Pick<SanitizedCollectionConfig['upload'], 'mimeTypes' | 'pasteURL'>
}

/**
 * Shared by the `Upload` and `FileManager` elements: reads the clipboard and routes the result
 * to file selection, URL fetching, or the paste-URL modal depending on what was found.
 */
export const usePasteFromClipboard = ({
  handleFileSelection,
  handleUrlSubmit,
  setFileUrl,
  uploadConfig,
}: UsePasteFromClipboardArgs): (() => Promise<void>) => {
  const { openModal } = useModal()
  const { t } = useTranslation()
  const { setUploadControlFile, setUploadControlFileName, setUploadControlFileUrl } =
    useUploadControls()

  return useCallback(async () => {
    try {
      const result = await getFileOrUrlFromClipboard()

      if (result?.type === 'file') {
        const [pastedFile] = result.files
        if (
          uploadConfig?.mimeTypes?.length &&
          !validateMimeType(pastedFile.type, uploadConfig.mimeTypes)
        ) {
          toast.error(t('error:invalidFileType'))
          return
        }
        handleFileSelection(result.files)
        return
      }

      if (uploadConfig?.pasteURL === false) {
        toast.error(t('error:noFileFoundInClipboard'))
        return
      }

      if (result?.type === 'url') {
        setFileUrl(result.url)
        const didFetchSucceed = await handleUrlSubmit(result.url)
        if (!didFetchSucceed) {
          openModal(pasteURLDrawerSlug)
        }
        return
      }

      openModal(pasteURLDrawerSlug)
      setUploadControlFileUrl('')
      setUploadControlFile(null)
      setUploadControlFileName(null)
    } catch (_err) {
      toast.error(t('error:unableToReadClipboard'))
    }
  }, [
    handleFileSelection,
    handleUrlSubmit,
    openModal,
    setFileUrl,
    setUploadControlFile,
    setUploadControlFileName,
    setUploadControlFileUrl,
    t,
    uploadConfig,
  ])
}
