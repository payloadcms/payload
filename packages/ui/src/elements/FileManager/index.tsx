'use client'
import type { SanitizedCollectionConfig, UploadEdits } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL, formatFilesize, isImage } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FieldError } from '../../fields/FieldError/index.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { TextInput } from '../../fields/Text/Input.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadControls } from '../../providers/UploadControls/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { Button } from '../Button/index.js'
import { Drawer } from '../Drawer/index.js'
import { Dropzone } from '../Dropzone/index.js'
import { EditUpload } from '../EditUpload/index.js'
import { PreviewSizes } from '../PreviewSizes/index.js'
import { Thumbnail } from '../Thumbnail/index.js'
import { editDrawerSlug, sizePreviewSlug } from '../Upload/index.js'
import { pasteURLDrawerSlug, UploadFromURLModal } from '../Upload/UploadFromURLModal/index.js'
import './index.css'
import { AudioPreview } from './FilePreview/AudioPreview/index.js'
import { FilePreview } from './FilePreview/index.js'
import { PdfPreview } from './FilePreview/PdfPreview/index.js'
import { VideoPreview } from './FilePreview/VideoPreview/index.js'
import { FileToolbar } from './FileToolbar/index.js'

const baseClass = 'file-manager'

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.'
  }
  if (value && (!value.name || value.name === '')) {
    return 'A file name is required.'
  }
  return true
}

export type FileManagerProps = {
  readonly collectionSlug: string
  readonly initialState?: import('payload').FormState
  /**
   * When provided, upload edits are sourced from these props instead of the `useUploadEdits`
   * context. The bulk upload drawer uses this to drive per-file edits from its FormsManager.
   */
  readonly resetUploadEdits?: () => void
  readonly updateUploadEdits?: (args: UploadEdits) => void
  readonly uploadConfig: SanitizedCollectionConfig['upload']
  readonly UploadControls?: React.ReactNode
  readonly uploadEdits?: UploadEdits
  readonly UploadFilePreview?: React.ReactNode
}

export const FileManager: React.FC<FileManagerProps> = ({
  collectionSlug,
  initialState,
  resetUploadEdits: resetUploadEditsFromProps,
  updateUploadEdits: updateUploadEditsFromProps,
  uploadConfig,
  UploadControls,
  uploadEdits: uploadEditsFromProps,
  UploadFilePreview,
}) => {
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()
  const { setModified } = useForm()
  const { id, data, setUploadStatus } = useDocumentInfo()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const {
    setUploadControlFile,
    setUploadControlFileName,
    setUploadControlFileUrl,
    uploadControlFile,
    uploadControlFileName,
    uploadControlFileUrl,
  } = useUploadControls()
  const uploadEditsContext = useUploadEdits()
  const resetUploadEdits = resetUploadEditsFromProps ?? uploadEditsContext.resetUploadEdits
  const updateUploadEdits = updateUploadEditsFromProps ?? uploadEditsContext.updateUploadEdits
  const uploadEdits = uploadEditsFromProps ?? uploadEditsContext.uploadEdits

  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const [removedFile, setRemovedFile] = useState(false)
  const [filename, setFilename] = useState<string>(value?.name || '')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<null | string>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const useServerSideFetch =
    typeof uploadConfig?.pasteURL === 'object' && uploadConfig.pasteURL.allowList?.length > 0

  const acceptMimeTypes = uploadConfig.mimeTypes?.join(', ')
  const imageCacheTag = uploadConfig?.cacheTags && data?.updatedAt

  const hasImageSizes = uploadConfig?.imageSizes?.length > 0
  const hasResizeOptions = Boolean(uploadConfig?.resizeOptions)
  const focalPointEnabled = uploadConfig?.focalPoint === true
  const { crop: showCrop = true, focalPoint = true } = uploadConfig
  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions || focalPointEnabled)

  const selectedSizeData = selectedSize
    ? (data?.sizes?.[selectedSize] as Record<string, unknown>)
    : null
  const sidePanelFileSrc = (selectedSizeData?.url ?? data?.thumbnailURL ?? data?.url ?? null) as
    | null
    | string
  const sidePanelMimeType = data?.mimeType as string | undefined
  const fileTypeIsAdjustable =
    !!sidePanelMimeType &&
    isImage(sidePanelMimeType) &&
    sidePanelMimeType !== 'image/svg+xml' &&
    sidePanelMimeType !== 'image/jxl'

  const renameFile = (fileToChange: File, newName: string): File =>
    new File([fileToChange], newName, {
      type: fileToChange.type,
      lastModified: fileToChange.lastModified,
    })

  const handleFileChange = useCallback(
    ({ file, isNewFile = true }: { file: File | null; isNewFile?: boolean }) => {
      if (isNewFile && file instanceof File) {
        setFileSrc(URL.createObjectURL(file))
      }
      setValue(file)
      setUploadControlFileUrl('')
      setUploadControlFileName(null)
      setUploadControlFile(null)
    },
    [setValue, setUploadControlFile, setUploadControlFileName, setUploadControlFileUrl],
  )

  const handleFileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const updatedFileName = e.target.value
      if (value) {
        handleFileChange({ file: renameFile(value, updatedFileName), isNewFile: false })
        setFilename(updatedFileName)
      }
    },
    [handleFileChange, value],
  )

  const handleFileRemoval = useCallback(() => {
    setRemovedFile(true)
    handleFileChange({ file: null })
    setFileSrc('')
    setFileUrl('')
    setSelectedSize(null)
    resetUploadEdits()
    setUploadControlFileUrl('')
    setUploadControlFileName(null)
    setUploadControlFile(null)
  }, [
    handleFileChange,
    resetUploadEdits,
    setUploadControlFile,
    setUploadControlFileName,
    setUploadControlFileUrl,
  ])

  const handleFileSelection = useCallback(
    (files: FileList) => handleFileChange({ file: files?.[0] }),
    [handleFileChange],
  )

  const isValidUrl = Boolean(fileUrl && URL.canParse(fileUrl))

  const handleUrlSubmit = useCallback(async () => {
    if (!fileUrl || !URL.canParse(fileUrl) || uploadConfig?.pasteURL === false) {
      return
    }
    setUploadStatus('uploading')
    try {
      const clientResponse = await fetch(fileUrl)
      if (!clientResponse.ok) {
        throw new Error(`Fetch failed: ${clientResponse.status}`)
      }
      const blob = await clientResponse.blob()
      const rawSegment = fileUrl.split('/').pop() || ''
      const fileName = uploadControlFileName || decodeURIComponent(rawSegment.split('?')[0])
      handleFileChange({ file: new File([blob], fileName, { type: blob.type }) })
      setUploadStatus('idle')
      closeModal(pasteURLDrawerSlug)
      setFileUrl('')
      return
    } catch (_clientError) {
      if (!useServerSideFetch) {
        toast.error('Failed to fetch the file.')
        setUploadStatus('failed')
        return
      }
    }
    try {
      const pasteURL: `/${string}` = `/${collectionSlug}/paste-url${id ? `/${id}?` : '?'}src=${encodeURIComponent(fileUrl)}`
      const serverResponse = await fetch(formatAdminURL({ apiRoute: api, path: pasteURL }))
      if (!serverResponse.ok) {
        throw new Error(`Fetch failed: ${serverResponse.status}`)
      }
      const blob = await serverResponse.blob()
      const rawSegment = fileUrl.split('/').pop() || ''
      const fileName = decodeURIComponent(rawSegment.split('?')[0])
      handleFileChange({ file: new File([blob], fileName, { type: blob.type }) })
      setUploadStatus('idle')
      closeModal(pasteURLDrawerSlug)
      setFileUrl('')
    } catch (_serverError) {
      toast.error('The provided URL is not allowed.')
      setUploadStatus('failed')
    }
  }, [
    api,
    closeModal,
    collectionSlug,
    fileUrl,
    handleFileChange,
    id,
    setUploadStatus,
    uploadConfig,
    uploadControlFileName,
    useServerSideFetch,
  ])

  const onEditsSave = useCallback(
    (args: UploadEdits) => {
      setModified(true)
      updateUploadEdits(args)
    },
    [setModified, updateUploadEdits],
  )

  useEffect(() => {
    if (initialState?.file?.value instanceof File) {
      setFileSrc(URL.createObjectURL(initialState.file.value))
      setRemovedFile(false)
    }
  }, [initialState])

  useEffect(() => {
    return () => {
      if (fileSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(fileSrc)
      }
    }
  }, [fileSrc])

  useEffect(() => {
    setSelectedSize(null)
  }, [data?.url, data?.filename])

  useEffect(() => {
    const handleControlFileUrl = async () => {
      if (uploadControlFileUrl) {
        setFileUrl(uploadControlFileUrl)
        await handleUrlSubmit()
      }
    }
    void handleControlFileUrl()
  }, [uploadControlFileUrl, handleUrlSubmit])

  useEffect(() => {
    if (uploadControlFile) {
      handleFileChange({ file: uploadControlFile })
    }
  }, [uploadControlFile, handleFileChange])

  // Preview a freshly-selected (not-yet-saved) file from its local object URL, so video/audio/PDF
  // are playable/viewable just like images. Sizing is capped in CSS so large files stay contained.
  const renderSelectedFilePreview = (src: string) => {
    const fileType = value?.type ?? ''

    if (fileType.startsWith('video/')) {
      return (
        <div className={`${baseClass}__selected-preview`}>
          <VideoPreview fileSrc={src} />
        </div>
      )
    }

    if (fileType.startsWith('audio/')) {
      return (
        <div className={`${baseClass}__selected-preview ${baseClass}__selected-preview--audio`}>
          <AudioPreview fileSrc={src} />
        </div>
      )
    }

    if (fileType === 'application/pdf') {
      return (
        <div className={`${baseClass}__selected-preview`}>
          <PdfPreview fileSrc={src} title={value?.name} />
        </div>
      )
    }

    return (
      <div className={`${baseClass}__selected-preview`}>
        <Thumbnail
          collectionSlug={collectionSlug}
          fileSrc={isImage(fileType) ? src : null}
          size="expand"
        />
      </div>
    )
  }

  const drawers = (
    <Fragment>
      {(value || data?.filename) && (
        <EditDepthProvider>
          <EditUpload
            fileName={value?.name || (data?.filename as string)}
            fileSrc={(data?.url as string) || fileSrc}
            imageCacheTag={imageCacheTag}
            initialCrop={uploadEdits?.crop ?? undefined}
            initialFocalPoint={{
              x: uploadEdits?.focalPoint?.x || (data?.focalX as number) || 50,
              y: uploadEdits?.focalPoint?.y || (data?.focalY as number) || 50,
            }}
            onSave={onEditsSave}
            showCrop={showCrop}
            showFocalPoint={showFocalPoint}
          />
        </EditDepthProvider>
      )}
      {data && hasImageSizes && (
        <Drawer
          className={`${baseClass}__preview-drawer`}
          hoverTitle
          slug={sizePreviewSlug}
          title={t('upload:sizesFor', { label: data.filename })}
        >
          <PreviewSizes doc={data} imageCacheTag={imageCacheTag} uploadConfig={uploadConfig} />
        </Drawer>
      )}
      {uploadConfig?.pasteURL !== false && (
        <UploadFromURLModal
          fileUrl={fileUrl}
          handleUrlSubmit={handleUrlSubmit}
          isValidUrl={isValidUrl}
          setFileUrl={setFileUrl}
        />
      )}
    </Fragment>
  )

  // Hide the create file input when the collection opts out of it (unless the user has explicitly
  // removed an existing file or already selected a new one).
  const showUploadInput = Boolean(value) || removedFile || !uploadConfig?.hideFileInputOnCreate

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <FieldError message={errorMessage} showError={showError} />
      <div className={`${baseClass}__panel`}>
        {data?.filename && !removedFile && (
          <FileToolbar
            filename={data.filename as string}
            fileSrc={sidePanelFileSrc}
            fileUrl={data?.url as string}
            hideRemoveFile={uploadConfig?.hideRemoveFile}
            isAdjustable={fileTypeIsAdjustable}
            onEditImage={() => openModal(editDrawerSlug)}
            onReplace={handleFileRemoval}
          />
        )}
        <div className={`${baseClass}__content`}>
          {data?.filename && !removedFile ? (
            <FilePreview
              collectionSlug={collectionSlug}
              data={data as Record<string, unknown>}
              imageCacheTag={imageCacheTag}
              selectedSize={selectedSize}
              selectedSizeData={selectedSizeData}
              setSelectedSize={setSelectedSize}
              uploadConfig={uploadConfig}
              UploadFilePreview={UploadFilePreview}
            />
          ) : showUploadInput ? (
            <div className={`${baseClass}__upload`}>
              {!value && (
                <Dropzone onChange={handleFileSelection}>
                  <div className={`${baseClass}__dropzone-content`}>
                    <div className={`${baseClass}__dropzone-buttons`}>
                      <Button
                        buttonStyle="secondary"
                        onClick={() => inputRef.current?.click()}
                        size="medium"
                      >
                        {t('upload:selectFile')}
                      </Button>
                      <input
                        accept={acceptMimeTypes}
                        aria-hidden="true"
                        className={`${baseClass}__hidden-input`}
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileSelection(e.target.files)
                          }
                        }}
                        ref={inputRef}
                        type="file"
                      />
                      {uploadConfig?.pasteURL !== false && (
                        <Fragment>
                          <span className={`${baseClass}__or-text`}>{t('general:or')}</span>
                          <Button
                            buttonStyle="secondary"
                            onClick={() => {
                              openModal(pasteURLDrawerSlug)
                              setUploadControlFileUrl('')
                              setUploadControlFile(null)
                              setUploadControlFileName(null)
                            }}
                            size="medium"
                          >
                            {t('upload:pasteURL')}
                          </Button>
                        </Fragment>
                      )}
                      {UploadControls ?? null}
                    </div>
                    <p className={`${baseClass}__drag-text`}>
                      {t('general:or')} {t('upload:dragAndDrop')}
                    </p>
                  </div>
                </Dropzone>
              )}
              {value && fileSrc && (
                <Fragment>
                  <Button
                    buttonStyle="ghost"
                    className={`${baseClass}__remove`}
                    icon="x"
                    onClick={handleFileRemoval}
                    round
                    tooltip={t('general:cancel')}
                  />
                  {renderSelectedFilePreview(fileSrc)}
                  <div className={`${baseClass}__file-adjustments`}>
                    <TextInput
                      label={t('upload:fileName')}
                      onChange={handleFileNameChange}
                      path="filename"
                      value={filename || value.name}
                    />
                    {(value.size || value.type) && (
                      <span className={`${baseClass}__selected-meta`}>
                        {[value.size ? formatFilesize(value.size) : null, value.type]
                          .filter(Boolean)
                          .join(' – ')}
                      </span>
                    )}
                  </div>
                </Fragment>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {drawers}
    </div>
  )
}
