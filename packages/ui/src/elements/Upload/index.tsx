'use client'
import type { FormState, SanitizedCollectionConfig, UploadEdits } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL, isImage } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FieldError } from '../../fields/FieldError/index.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { TextInput } from '../../fields/Text/Input.js'
import { useForm, useFormProcessing } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { UploadControlsProvider, useUploadControls } from '../../providers/UploadControls/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { Button } from '../Button/index.js'
import { Drawer } from '../Drawer/index.js'
import { Dropzone } from '../Dropzone/index.js'
import { EditUpload } from '../EditUpload/index.js'
import './index.css'
import { FileDetails } from '../FileDetails/index.js'
import { PreviewSizes } from '../PreviewSizes/index.js'
import { Thumbnail } from '../Thumbnail/index.js'
import { pasteURLDrawerSlug, UploadFromURLModal } from './UploadFromURLModal/index.js'

export { pasteURLDrawerSlug }

const baseClass = 'file-field'
export const editDrawerSlug = 'edit-upload'
export const sizePreviewSlug = 'preview-sizes'

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.'
  }

  if (value && (!value.name || value.name === '')) {
    return 'A file name is required.'
  }

  return true
}

type UploadActionsArgs = {
  readonly customActions?: React.ReactNode[]
  readonly enableAdjustments: boolean
  readonly enablePreviewSizes: boolean
  readonly mimeType: string
}

export const UploadActions = ({
  customActions,
  enableAdjustments,
  enablePreviewSizes,
  mimeType,
}: UploadActionsArgs) => {
  const { t } = useTranslation()
  const { openModal } = useModal()

  const fileTypeIsAdjustable =
    isImage(mimeType) && mimeType !== 'image/svg+xml' && mimeType !== 'image/jxl'

  if (!fileTypeIsAdjustable && (!customActions || customActions.length === 0)) {
    return null
  }

  return (
    <div className={`${baseClass}__upload-actions`}>
      {fileTypeIsAdjustable && (
        <React.Fragment>
          {enablePreviewSizes && (
            <Button
              buttonStyle="pill"
              className={`${baseClass}__previewSizes`}
              margin={false}
              onClick={() => {
                openModal(sizePreviewSlug)
              }}
              size="medium"
            >
              {t('upload:previewSizes')}
            </Button>
          )}
          {enableAdjustments && (
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__edit`}
              margin={false}
              onClick={() => {
                openModal(editDrawerSlug)
              }}
              size="medium"
            >
              {t('upload:editImage')}
            </Button>
          )}
        </React.Fragment>
      )}

      {customActions &&
        customActions.map((CustomAction, i) => {
          return <React.Fragment key={i}>{CustomAction}</React.Fragment>
        })}
    </div>
  )
}

export type UploadProps = {
  readonly collectionSlug: string
  readonly customActions?: React.ReactNode[]
  readonly initialState?: FormState
  readonly onChange?: (file?: File) => void
  readonly uploadConfig: SanitizedCollectionConfig['upload']
  readonly UploadControls?: React.ReactNode
}

export const Upload: React.FC<UploadProps> = (props) => {
  const { resetUploadEdits, updateUploadEdits, uploadEdits } = useUploadEdits()
  return (
    <UploadControlsProvider>
      <UploadComponent
        {...props}
        resetUploadEdits={resetUploadEdits}
        updateUploadEdits={updateUploadEdits}
        uploadEdits={uploadEdits}
      />
    </UploadControlsProvider>
  )
}

type UploadComponentProps = {
  readonly resetUploadEdits?: () => void
  readonly updateUploadEdits?: (args: UploadEdits) => void
  readonly uploadEdits?: UploadEdits
} & UploadProps

const UploadComponent: React.FC<UploadComponentProps> = (props) => {
  const {
    collectionSlug,
    customActions,
    initialState,
    onChange,
    resetUploadEdits,
    updateUploadEdits,
    uploadConfig,
    UploadControls,
    uploadEdits,
  } = props

  const {
    setUploadControlFile,
    setUploadControlFileName,
    setUploadControlFileUrl,
    uploadControlFile,
    uploadControlFileName,
    uploadControlFileUrl,
  } = useUploadControls()

  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const { t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const { setModified } = useForm()
  const { id, data, docPermissions, setUploadStatus } = useDocumentInfo()
  const isFormSubmitting = useFormProcessing()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })

  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const [removedFile, setRemovedFile] = useState(false)
  const [filename, setFilename] = useState<string>(value?.name || '')
  const [fileUrl, setFileUrl] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)

  const useServerSideFetch =
    typeof uploadConfig?.pasteURL === 'object' && uploadConfig.pasteURL.allowList?.length > 0

  const handleFileChange = useCallback(
    ({ file, isNewFile = true }: { file: File | null; isNewFile?: boolean }) => {
      if (isNewFile && file instanceof File) {
        setFileSrc(URL.createObjectURL(file))
      }

      setValue(file)
      setUploadControlFileUrl('')
      setUploadControlFileName(null)
      setUploadControlFile(null)

      if (typeof onChange === 'function') {
        onChange(file)
      }
    },
    [onChange, setValue, setUploadControlFile, setUploadControlFileName, setUploadControlFileUrl],
  )

  const renameFile = (fileToChange: File, newName: string): File => {
    // Creating a new File object with updated properties
    const newFile = new File([fileToChange], newName, {
      type: fileToChange.type,
      lastModified: fileToChange.lastModified,
    })
    return newFile
  }

  const handleFileNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const updatedFileName = e.target.value

      if (value) {
        handleFileChange({ file: renameFile(value, updatedFileName), isNewFile: false })
        setFilename(updatedFileName)
      }
    },
    [handleFileChange, value],
  )

  const handleFileSelection = useCallback(
    (files: FileList) => {
      const fileToUpload = files?.[0]
      handleFileChange({ file: fileToUpload })
    },
    [handleFileChange],
  )

  const handleFileRemoval = useCallback(() => {
    setRemovedFile(true)
    handleFileChange({ file: null })
    setFileSrc('')
    setFileUrl('')
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

  const onEditsSave = useCallback(
    (args: UploadEdits) => {
      setModified(true)
      updateUploadEdits(args)
    },
    [setModified, updateUploadEdits],
  )

  const isValidUrl = Boolean(fileUrl && URL.canParse(fileUrl))

  const handleUrlSubmit = useCallback(async () => {
    if (!fileUrl || !URL.canParse(fileUrl) || uploadConfig?.pasteURL === false) {
      return
    }

    setUploadStatus('uploading')
    try {
      // Attempt client-side fetch
      const clientResponse = await fetch(fileUrl)

      if (!clientResponse.ok) {
        throw new Error(`Fetch failed with status: ${clientResponse.status}`)
      }

      const blob = await clientResponse.blob()
      const rawSegment = fileUrl.split('/').pop() || ''
      const fileName = uploadControlFileName || decodeURIComponent(rawSegment.split('?')[0])
      const file = new File([blob], fileName, { type: blob.type })

      handleFileChange({ file })
      setUploadStatus('idle')
      closeModal(pasteURLDrawerSlug)
      setFileUrl('')
      return // Exit if client-side fetch succeeds
    } catch (_clientError) {
      if (!useServerSideFetch) {
        // If server-side fetch is not enabled, show client-side error
        toast.error('Failed to fetch the file.')
        setUploadStatus('failed')
        return
      }
    }

    // Attempt server-side fetch if client-side fetch fails and useServerSideFetch is true
    try {
      const pasteURL: `/${string}` = `/${collectionSlug}/paste-url${id ? `/${id}?` : '?'}src=${encodeURIComponent(fileUrl)}`
      const serverResponse = await fetch(
        formatAdminURL({
          apiRoute: api,
          path: pasteURL,
        }),
      )

      if (!serverResponse.ok) {
        throw new Error(`Fetch failed with status: ${serverResponse.status}`)
      }

      const blob = await serverResponse.blob()
      const rawSegment = fileUrl.split('/').pop() || ''
      const fileName = decodeURIComponent(rawSegment.split('?')[0])
      const file = new File([blob], fileName, { type: blob.type })

      handleFileChange({ file })
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

  useEffect(() => {
    if (initialState?.file?.value instanceof File) {
      setFileSrc(URL.createObjectURL(initialState.file.value))
      setRemovedFile(false)
    }
  }, [initialState])

  useEffect(() => {
    if (isFormSubmitting) {
      setRemovedFile(false)
    }
  }, [isFormSubmitting])

  const canRemoveUpload = docPermissions?.update

  const hasImageSizes = uploadConfig?.imageSizes?.length > 0
  const hasResizeOptions = Boolean(uploadConfig?.resizeOptions)
  // Explicity check if set to true, default is undefined
  const focalPointEnabled = uploadConfig?.focalPoint === true

  const { crop: showCrop = true, focalPoint = true } = uploadConfig

  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions || focalPointEnabled)

  const acceptMimeTypes = uploadConfig.mimeTypes?.join(', ')

  const imageCacheTag = uploadConfig?.cacheTags && data?.updatedAt

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
    const handleControlFile = () => {
      if (uploadControlFile) {
        handleFileChange({ file: uploadControlFile })
      }
    }

    void handleControlFile()
  }, [uploadControlFile, handleFileChange])

  const drawers = (
    <React.Fragment>
      {(value || data?.filename) && (
        <EditDepthProvider>
          <EditUpload
            fileName={value?.name || data?.filename}
            fileSrc={data?.url || fileSrc}
            imageCacheTag={imageCacheTag}
            initialCrop={uploadEdits?.crop ?? undefined}
            initialFocalPoint={{
              x: uploadEdits?.focalPoint?.x || data?.focalX || 50,
              y: uploadEdits?.focalPoint?.y || data?.focalY || 50,
            }}
            onSave={onEditsSave}
            showCrop={showCrop}
            showFocalPoint={showFocalPoint}
          />
        </EditDepthProvider>
      )}
      {data && hasImageSizes && (
        <Drawer
          className={`${baseClass}__previewDrawer`}
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
    </React.Fragment>
  )

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <FieldError message={errorMessage} showError={showError} />
      {data && data.filename && !removedFile && (
        <FileDetails
          collectionSlug={collectionSlug}
          customUploadActions={customActions}
          doc={data}
          enableAdjustments={showCrop || showFocalPoint}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
          hasImageSizes={hasImageSizes}
          hideRemoveFile={uploadConfig.hideRemoveFile}
          imageCacheTag={imageCacheTag}
          uploadConfig={uploadConfig}
        />
      )}
      {((!uploadConfig.hideFileInputOnCreate && !data?.filename) || removedFile) && (
        <div className={`${baseClass}__upload`}>
          {!value && (
            <Dropzone onChange={handleFileSelection}>
              <div className={`${baseClass}__dropzoneContent`}>
                <div className={`${baseClass}__dropzoneButtons`}>
                  <Button
                    buttonStyle="pill"
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.click()
                      }
                    }}
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
                      <span className={`${baseClass}__orText`}>{t('general:or')}</span>
                      <Button
                        buttonStyle="pill"
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

                  {UploadControls ? UploadControls : null}
                </div>
                <p className={`${baseClass}__dragAndDropText`}>
                  {t('general:or')} {t('upload:dragAndDrop')}
                </p>
              </div>
            </Dropzone>
          )}
          {value && fileSrc && (
            <React.Fragment>
              <Button
                buttonStyle="ghost"
                className={`${baseClass}__remove`}
                icon="x"
                onClick={handleFileRemoval}
                round
                tooltip={t('general:cancel')}
              />
              <div className={`${baseClass}__thumbnail-wrap`}>
                <Thumbnail
                  collectionSlug={collectionSlug}
                  fileSrc={isImage(value.type) ? fileSrc : null}
                />
              </div>
              <div className={`${baseClass}__file-adjustments`}>
                <TextInput
                  label={t('upload:fileName')}
                  onChange={handleFileNameChange}
                  path="filename"
                  value={filename || value.name}
                />
                <UploadActions
                  customActions={customActions}
                  enableAdjustments={showCrop || showFocalPoint}
                  enablePreviewSizes={hasImageSizes && data?.filename && !removedFile}
                  mimeType={value.type}
                />
              </div>
            </React.Fragment>
          )}
        </div>
      )}
      {drawers}
    </div>
  )
}
