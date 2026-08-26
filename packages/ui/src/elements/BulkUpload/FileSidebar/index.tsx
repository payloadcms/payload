'use client'

import { isImage } from 'payload/shared'
import React from 'react'

import { SelectInput } from '../../../fields/Select/Input.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ErrorPill } from '../../ErrorPill/index.js'
import { ShimmerEffect } from '../../ShimmerEffect/index.js'
import { createThumbnail } from '../../Thumbnail/createThumbnail.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import './index.css'
import { useFormsManager } from '../FormsManager/index.js'
import { useBulkUpload } from '../index.js'

const baseClass = 'file-selections'

export function FileSidebar() {
  const { activeIndex, forms, isInitializing, removeFile, setActiveIndex } = useFormsManager()
  const { initialFiles, initialForms } = useBulkUpload()
  const { i18n, t } = useTranslation()

  const handleRemoveFile = React.useCallback(
    (indexToRemove: number) => {
      removeFile(indexToRemove)
    },
    [removeFile],
  )

  const getFileSize = React.useCallback((file: File) => {
    const size = file.size
    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
    const decimals = i > 1 ? 1 : 0
    const formattedSize =
      (size / Math.pow(1024, i)).toFixed(decimals) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
    return formattedSize
  }, [])

  const {
    collectionSlug: bulkUploadCollectionSlug,
    selectableCollections,
    setCollectionSlug,
  } = useBulkUpload()

  const { getEntityConfig } = useConfig()

  return (
    <div className={baseClass}>
      {selectableCollections?.length > 1 && (
        <div className={`${baseClass}__header`}>
          <SelectInput
            className={`${baseClass}__collectionSelect`}
            isClearable={false}
            name="groupBy"
            onChange={(e) => {
              const val: string =
                typeof e === 'object' && 'value' in e
                  ? (e?.value as string)
                  : (e as unknown as string)
              setCollectionSlug(val)
            }}
            options={
              selectableCollections?.map((coll) => {
                const config = getEntityConfig({ collectionSlug: coll })
                return { label: config.labels.singular, value: config.slug }
              }) || []
            }
            path="groupBy"
            required
            value={bulkUploadCollectionSlug}
          />
        </div>
      )}

      <div className={`${baseClass}__animateWrapper scrollbar-thin`}>
        <div className={`${baseClass}__filesContainer`}>
          {isInitializing &&
          forms.length === 0 &&
          (initialFiles?.length > 0 || initialForms?.length > 0)
            ? (initialFiles ? Array.from(initialFiles) : initialForms).map((file, index) => (
                <ShimmerEffect
                  animationDelay={`calc(${index} * ${60}ms)`}
                  height="35px"
                  key={index}
                />
              ))
            : null}
          {forms.map(({ errorCount, formID, formState }, index) => {
            const currentFile = (formState?.file?.value as File) || ({} as File)

            return (
              <div
                className={[
                  `${baseClass}__fileRowContainer`,
                  index === activeIndex && `${baseClass}__fileRowContainer--active`,
                  errorCount && errorCount > 0 && `${baseClass}__fileRowContainer--error`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={formID}
              >
                <button
                  className={`${baseClass}__fileRow`}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <SidebarThumbnail file={currentFile} formID={formID} />
                  <div className={`${baseClass}__fileDetails`}>
                    <p className={`${baseClass}__fileName`} title={currentFile.name}>
                      {currentFile.name || t('upload:noFile')}
                    </p>
                  </div>
                  {currentFile instanceof File ? (
                    <p className={`${baseClass}__fileSize`}>{getFileSize(currentFile)}</p>
                  ) : null}
                  <div className={`${baseClass}__remove ${baseClass}__remove--underlay`}>
                    <XIcon />
                  </div>

                  {errorCount ? (
                    <ErrorPill
                      className={`${baseClass}__errorCount`}
                      count={errorCount}
                      i18n={i18n}
                    />
                  ) : null}
                </button>

                <button
                  aria-label={t('general:remove')}
                  className={`${baseClass}__remove ${baseClass}__remove--overlay`}
                  onClick={() => handleRemoveFile(index)}
                  type="button"
                >
                  <XIcon />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SidebarThumbnail({ file, formID }: { file: File; formID: string }) {
  const [thumbnailURL, setThumbnailURL] = React.useState<null | string>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let isCancelled = false

    async function generateThumbnail() {
      setIsLoading(true)
      setThumbnailURL(null)

      try {
        if (isImage(file.type)) {
          const url = await createThumbnail(file)
          if (!isCancelled) {
            setThumbnailURL(url)
          }
        } else {
          setThumbnailURL(null)
        }
      } catch (_) {
        if (!isCancelled) {
          setThumbnailURL(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void generateThumbnail()

    return () => {
      isCancelled = true
    }
  }, [file])

  if (isLoading) {
    return <ShimmerEffect className={`${baseClass}__thumbnail-shimmer`} disableInlineStyles />
  }

  return (
    <Thumbnail
      className={`${baseClass}__thumbnail`}
      fileSrc={thumbnailURL}
      key={`${formID}-${thumbnailURL || 'placeholder'}`}
    />
  )
}
