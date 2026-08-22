'use client'
import type { FormState, SanitizedCollectionConfig, UploadEdits } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { isImage } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { FieldError } from '../../fields/FieldError/index.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { TextInput } from '../../fields/Text/Input.js'
import { useForm, useFormProcessing } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { UploadControlsProvider, useUploadControls } from '../../providers/UploadControls/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { Button } from '../Button/index.js'
import { Drawer } from '../Drawer/index.js'
import { Dropzone } from '../Dropzone/index.js'
import './index.css'
import { EditUpload } from '../EditUpload/index.js'
import { FileDetails } from '../FileDetails/index.js'
import { PreviewSizes } from '../PreviewSizes/index.js'
import { Thumbnail } from '../Thumbnail/index.js'
import { pasteURLDrawerSlug, UploadFromURLModal } from './UploadFromURLModal/index.js'
import { usePasteFromClipboard } from './usePasteFromClipboard.js'
import { useUploadFromUrl } from './useUploadFromUrl.js'

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
  readonly uploadConfig: Omit<SanitizedCollectionConfig['upload'], 'uploadInstructions'>
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
    uploadControlFileUrl,
  } = useUploadControls()

  const { t } = useTranslation()
  const { setModified } = useForm()
  const { data, docPermissions } = useDocumentInfo()
  const isFormSubmitting = useFormProcessing()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })

  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const [removedFile, setRemovedFile] = useState(false)
  const [filename, setFilename] = useState<string>(value?.name || '')

  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleFileFetchedFromUrl = useCallback(
    (file: File) => handleFileChange({ file }),
    [handleFileChange],
  )

  const { fileUrl, handleUrlSubmit, isValidUrl, setFileUrl } = useUploadFromUrl({
    collectionSlug,
    onFileFetched: handleFileFetchedFromUrl,
    uploadConfig,
  })

  const handlePasteFromClipboard = usePasteFromClipboard({
    handleFileSelection,
    handleUrlSubmit,
    setFileUrl,
    uploadConfig,
  })

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
    setFileUrl,
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
    if (isFormSubmitting) {
      setRemovedFile(false)
    }
  }, [isFormSubmitting])

  const canRemoveUpload = docPermissions?.update

  const hasImageSizes = uploadConfig?.imageSizes?.length > 0
  const hasImageAdjustments = Boolean(uploadConfig?.hasImageAdjustments)
  // Explicity check if set to true, default is undefined
  const focalPointEnabled = uploadConfig?.focalPoint === true

  const { crop: showCrop = true, focalPoint = true } = uploadConfig

  const showFocalPoint = focalPoint && (hasImageSizes || hasImageAdjustments || focalPointEnabled)

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
  }, [uploadControlFileUrl, handleUrlSubmit, setFileUrl])

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
                  <span className={`${baseClass}__orText`}>{t('general:or')}</span>
                  <Button
                    buttonStyle="pill"
                    className={`${baseClass}__pasteFromClipboard`}
                    icon="clipboard"
                    onClick={handlePasteFromClipboard}
                    size="medium"
                    tooltip={t('upload:pasteURL')}
                  />

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
