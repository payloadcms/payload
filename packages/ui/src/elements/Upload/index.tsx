'use client'
import type { FormState, SanitizedCollectionConfig, UploadEdits } from 'payload'

import { isImage } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FieldError } from '../../fields/FieldError/index.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { useForm, useFormProcessing } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { Button } from '../Button/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { Dropzone } from '../Dropzone/index.js'
import { EditUpload } from '../EditUpload/index.js'
import { FileDetails } from '../FileDetails/index.js'
import { PreviewSizes } from '../PreviewSizes/index.js'
import { Thumbnail } from '../Thumbnail/index.js'
import './index.scss'

const baseClass = 'file-field'
export const editDrawerSlug = 'edit-upload'
export const sizePreviewSlug = 'preview-sizes'

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.'
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
            <DrawerToggler className={`${baseClass}__previewSizes`} slug={sizePreviewSlug}>
              {t('upload:previewSizes')}
            </DrawerToggler>
          )}
          {enableAdjustments && (
            <DrawerToggler className={`${baseClass}__edit`} slug={editDrawerSlug}>
              {t('upload:editImage')}
            </DrawerToggler>
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
}

export const Upload: React.FC<UploadProps> = (props) => {
  const { resetUploadEdits, updateUploadEdits, uploadEdits } = useUploadEdits()
  return (
    <Upload_v4
      {...props}
      resetUploadEdits={resetUploadEdits}
      updateUploadEdits={updateUploadEdits}
      uploadEdits={uploadEdits}
    />
  )
}

export type UploadProps_v4 = {
  readonly resetUploadEdits?: () => void
  readonly updateUploadEdits?: (args: UploadEdits) => void
  readonly uploadEdits?: UploadEdits
} & UploadProps

export const Upload_v4: React.FC<UploadProps_v4> = (props) => {
  const {
    collectionSlug,
    customActions,
    initialState,
    onChange,
    resetUploadEdits,
    updateUploadEdits,
    uploadConfig,
    uploadEdits,
  } = props

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const { t } = useTranslation()
  const { setModified } = useForm()
  const { id, docPermissions, savedDocumentData, setUploadStatus } = useDocumentInfo()
  const isFormSubmitting = useFormProcessing()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })

  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const [removedFile, setRemovedFile] = useState(false)
  const [filename, setFilename] = useState<string>(value?.name || '')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [fileUrl, setFileUrl] = useState<string>('')

  const urlInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const useServerSideFetch =
    typeof uploadConfig?.pasteURL === 'object' && uploadConfig.pasteURL.allowList?.length > 0

  const handleFileChange = useCallback(
    (newFile: File) => {
      if (newFile instanceof File) {
        setFileSrc(URL.createObjectURL(newFile))
      }

      setValue(newFile)
      setShowUrlInput(false)

      if (typeof onChange === 'function') {
        onChange(newFile)
      }
    },
    [onChange, setValue],
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
        handleFileChange(renameFile(value, updatedFileName))
        setFilename(updatedFileName)
      }
    },
    [handleFileChange, value],
  )

  const handleFileSelection = useCallback(
    (files: FileList) => {
      const fileToUpload = files?.[0]
      handleFileChange(fileToUpload)
    },
    [handleFileChange],
  )

  const handleFileRemoval = useCallback(() => {
    setRemovedFile(true)
    handleFileChange(null)
    setFileSrc('')
    setFileUrl('')
    resetUploadEdits()
    setShowUrlInput(false)
  }, [handleFileChange, resetUploadEdits])

  const onEditsSave = useCallback(
    (args: UploadEdits) => {
      setModified(true)
      updateUploadEdits(args)
    },
    [setModified, updateUploadEdits],
  )

  const handleUrlSubmit = async () => {
    if (!fileUrl || uploadConfig?.pasteURL === false) {
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
      const fileName = decodeURIComponent(fileUrl.split('/').pop() || '')
      const file = new File([blob], fileName, { type: blob.type })

      handleFileChange(file)
      setUploadStatus('idle')
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
      const pasteURL = `/${collectionSlug}/paste-url${id ? `/${id}?` : '?'}src=${encodeURIComponent(fileUrl)}`
      const serverResponse = await fetch(`${serverURL}${api}${pasteURL}`)

      if (!serverResponse.ok) {
        throw new Error(`Fetch failed with status: ${serverResponse.status}`)
      }

      const blob = await serverResponse.blob()
      const fileName = decodeURIComponent(fileUrl.split('/').pop() || '')
      const file = new File([blob], fileName, { type: blob.type })

      handleFileChange(file)
      setUploadStatus('idle')
    } catch (_serverError) {
      toast.error('The provided URL is not allowed.')
      setUploadStatus('failed')
    }
  }

  useEffect(() => {
    if (initialState?.file?.value instanceof File) {
      setFileSrc(URL.createObjectURL(initialState.file.value))
      setRemovedFile(false)
    }
  }, [initialState])

  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      // urlInputRef.current.focus() // Focus on the remote-url input field when showUrlInput is true
    }
  }, [showUrlInput])

  useEffect(() => {
    if (isFormSubmitting) {
      setRemovedFile(false)
    }
  }, [isFormSubmitting])

  const canRemoveUpload =
    docPermissions?.update && 'delete' in docPermissions && docPermissions?.delete

  const hasImageSizes = uploadConfig?.imageSizes?.length > 0
  const hasResizeOptions = Boolean(uploadConfig?.resizeOptions)
  // Explicity check if set to true, default is undefined
  const focalPointEnabled = uploadConfig?.focalPoint === true

  const { crop: showCrop = true, focalPoint = true } = uploadConfig

  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions || focalPointEnabled)

  const acceptMimeTypes = uploadConfig.mimeTypes?.join(', ')

  const imageCacheTag = uploadConfig?.cacheTags && savedDocumentData?.updatedAt

  if (uploadConfig.hideFileInputOnCreate && !savedDocumentData?.filename) {
    return null
  }

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <FieldError message={errorMessage} showError={showError} />
      {savedDocumentData && savedDocumentData.filename && !removedFile && (
        <FileDetails
          collectionSlug={collectionSlug}
          customUploadActions={customActions}
          doc={savedDocumentData}
          enableAdjustments={showCrop || showFocalPoint}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
          hasImageSizes={hasImageSizes}
          hideRemoveFile={uploadConfig.hideRemoveFile}
          imageCacheTag={imageCacheTag}
          uploadConfig={uploadConfig}
        />
      )}
      {((!uploadConfig.hideFileInputOnCreate && !savedDocumentData?.filename) || removedFile) && (
        <div className={`${baseClass}__upload`}>
          {!value && !showUrlInput && (
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
                    size="small"
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
                          setShowUrlInput(true)
                        }}
                        size="small"
                      >
                        {t('upload:pasteURL')}
                      </Button>
                    </Fragment>
                  )}
                </div>

                <p className={`${baseClass}__dragAndDropText`}>
                  {t('general:or')} {t('upload:dragAndDrop')}
                </p>
              </div>
            </Dropzone>
          )}
          {showUrlInput && (
            <React.Fragment>
              <div className={`${baseClass}__remote-file-wrap`}>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <input
                  className={`${baseClass}__remote-file`}
                  onChange={(e) => {
                    setFileUrl(e.target.value)
                  }}
                  ref={urlInputRef}
                  type="text"
                  value={fileUrl}
                />
                <div className={`${baseClass}__add-file-wrap`}>
                  <button
                    className={`${baseClass}__add-file`}
                    onClick={() => {
                      void handleUrlSubmit()
                    }}
                    type="button"
                  >
                    {t('upload:addFile')}
                  </button>
                </div>
              </div>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="with-border"
                onClick={() => {
                  setShowUrlInput(false)
                }}
                round
                tooltip={t('general:cancel')}
              />
            </React.Fragment>
          )}
          {value && fileSrc && (
            <React.Fragment>
              <div className={`${baseClass}__thumbnail-wrap`}>
                <Thumbnail
                  collectionSlug={collectionSlug}
                  fileSrc={isImage(value.type) ? fileSrc : null}
                />
              </div>
              <div className={`${baseClass}__file-adjustments`}>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <input
                  className={`${baseClass}__filename`}
                  onChange={handleFileNameChange}
                  type="text"
                  value={filename || value.name}
                />
                <UploadActions
                  customActions={customActions}
                  enableAdjustments={showCrop || showFocalPoint}
                  enablePreviewSizes={hasImageSizes && savedDocumentData?.filename && !removedFile}
                  mimeType={value.type}
                />
              </div>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="with-border"
                onClick={handleFileRemoval}
                round
                tooltip={t('general:cancel')}
              />
            </React.Fragment>
          )}
        </div>
      )}
      {(value || savedDocumentData?.filename) && (
        <EditDepthProvider>
          <Drawer Header={null} slug={editDrawerSlug}>
            <EditUpload
              fileName={value?.name || savedDocumentData?.filename}
              fileSrc={savedDocumentData?.url || fileSrc}
              imageCacheTag={imageCacheTag}
              initialCrop={uploadEdits?.crop ?? undefined}
              initialFocalPoint={{
                x: uploadEdits?.focalPoint?.x || savedDocumentData?.focalX || 50,
                y: uploadEdits?.focalPoint?.y || savedDocumentData?.focalY || 50,
              }}
              onSave={onEditsSave}
              showCrop={showCrop}
              showFocalPoint={showFocalPoint}
            />
          </Drawer>
        </EditDepthProvider>
      )}
      {savedDocumentData && hasImageSizes && (
        <Drawer
          className={`${baseClass}__previewDrawer`}
          hoverTitle
          slug={sizePreviewSlug}
          title={t('upload:sizesFor', { label: savedDocumentData.filename })}
        >
          <PreviewSizes
            doc={savedDocumentData}
            imageCacheTag={imageCacheTag}
            uploadConfig={uploadConfig}
          />
        </Drawer>
      )}
    </div>
  )
}
