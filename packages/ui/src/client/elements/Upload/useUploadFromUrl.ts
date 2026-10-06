'use client'
import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL, validateMimeType } from 'payload/shared'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadControls } from '../../providers/UploadControls/index.js'
import { pasteURLDrawerSlug } from './UploadFromURLModal/index.js'

type UseUploadFromUrlArgs = {
  readonly collectionSlug: string
  readonly onFileFetched: (file: File) => void
  readonly uploadConfig: Pick<SanitizedCollectionConfig['upload'], 'mimeTypes' | 'pasteURL'>
}

type UseUploadFromUrlResult = {
  readonly fileUrl: string
  readonly handleUrlSubmit: (urlOverride?: string) => Promise<boolean>
  readonly isValidUrl: boolean
  readonly setFileUrl: (url: string) => void
}

const getFileNameFromUrl = ({
  overrideFileName,
  url,
}: {
  overrideFileName: null | string
  url: string
}): string => {
  const rawSegment = url.split('/').pop() || ''
  return overrideFileName || decodeURIComponent(rawSegment.split('?')[0])
}

/**
 * Shared by the `Upload` and `FileManager` elements to fetch a file from a pasted URL, first
 * attempting a client-side fetch and falling back to a server-side proxy fetch when the
 * collection's `pasteURL.allowList` is configured (needed to work around CORS-restricted URLs).
 */
export const useUploadFromUrl = ({
  collectionSlug,
  onFileFetched,
  uploadConfig,
}: UseUploadFromUrlArgs): UseUploadFromUrlResult => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { closeModal } = useModal()
  const { id, setUploadStatus } = useDocumentInfo()
  const { t } = useTranslation()
  const { uploadControlFileName } = useUploadControls()

  const [fileUrl, setFileUrl] = useState('')

  const isValidUrl = Boolean(fileUrl && URL.canParse(fileUrl))

  const useServerSideFetch =
    typeof uploadConfig?.pasteURL === 'object' && uploadConfig.pasteURL.allowList?.length > 0

  const acceptFetchedBlob = useCallback(
    ({ blob, url }: { blob: Blob; url: string }): boolean => {
      if (uploadConfig?.mimeTypes?.length && !validateMimeType(blob.type, uploadConfig.mimeTypes)) {
        toast.error(t('error:invalidFileType'))
        setUploadStatus('failed')
        return false
      }

      const fileName = getFileNameFromUrl({ overrideFileName: uploadControlFileName, url })
      onFileFetched(new File([blob], fileName, { type: blob.type }))
      setUploadStatus('idle')
      closeModal(pasteURLDrawerSlug)
      setFileUrl('')
      return true
    },
    [closeModal, onFileFetched, setUploadStatus, t, uploadConfig, uploadControlFileName],
  )

  const fetchFileFromClient = useCallback(
    async (url: string): Promise<boolean> => {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`)
      }

      const blob = await response.blob()
      return acceptFetchedBlob({ blob, url })
    },
    [acceptFetchedBlob],
  )

  const fetchFileFromServerProxy = useCallback(
    async (url: string): Promise<boolean> => {
      const pasteURL: `/${string}` = `/${collectionSlug}/paste-url${id ? `/${id}?` : '?'}src=${encodeURIComponent(url)}`
      const response = await fetch(formatAdminURL({ apiRoute: api, path: pasteURL }))

      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`)
      }

      const blob = await response.blob()
      return acceptFetchedBlob({ blob, url })
    },
    [acceptFetchedBlob, api, collectionSlug, id],
  )

  const handleUrlSubmit = useCallback(
    async (urlOverride?: string): Promise<boolean> => {
      const urlToFetch = urlOverride ?? fileUrl

      if (!urlToFetch || !URL.canParse(urlToFetch) || uploadConfig?.pasteURL === false) {
        return false
      }

      setUploadStatus('uploading')

      try {
        return await fetchFileFromClient(urlToFetch)
      } catch (_clientError) {
        if (!useServerSideFetch) {
          toast.error(t('error:fileFetchFailed'))
          setUploadStatus('failed')
          return false
        }
      }

      try {
        return await fetchFileFromServerProxy(urlToFetch)
      } catch (_serverError) {
        toast.error(t('error:urlNotAllowed'))
        setUploadStatus('failed')
        return false
      }
    },
    [
      fetchFileFromClient,
      fetchFileFromServerProxy,
      fileUrl,
      setUploadStatus,
      t,
      uploadConfig,
      useServerSideFetch,
    ],
  )

  return { fileUrl, handleUrlSubmit, isValidUrl, setFileUrl }
}
