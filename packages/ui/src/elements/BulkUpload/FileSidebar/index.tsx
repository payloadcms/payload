'use client'

import { useModal } from '@faceless-ui/modal'
import { useWindowInfo } from '@faceless-ui/window-info'
import { isImage } from 'payload/shared'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { AnimateHeight } from '../../AnimateHeight/index.js'
import { Button } from '../../Button/index.js'
import { Drawer } from '../../Drawer/index.js'
import { ErrorPill } from '../../ErrorPill/index.js'
import { Pill } from '../../Pill/index.js'
import { ShimmerEffect } from '../../ShimmerEffect/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import { Actions } from '../ActionsBar/index.js'
import './index.scss'
import { AddFilesView } from '../AddFilesView/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { useBulkUpload } from '../index.js'

const addMoreFilesDrawerSlug = 'bulk-upload-drawer--add-more-files'

const baseClass = 'file-selections'

export function FileSidebar() {
  const {
    activeIndex,
    addFiles,
    forms,
    isInitializing,
    removeFile,
    setActiveIndex,
    thumbnailUrls,
    totalErrorCount,
  } = useFormsManager()
  const { initialFiles, maxFiles } = useBulkUpload()
  const { i18n, t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const [showFiles, setShowFiles] = React.useState(false)
  const { breakpoints } = useWindowInfo()

  const handleRemoveFile = React.useCallback(
    (indexToRemove: number) => {
      removeFile(indexToRemove)
    },
    [removeFile],
  )

  const handleAddFiles = React.useCallback(
    (filelist: FileList) => {
      void addFiles(filelist)
      closeModal(addMoreFilesDrawerSlug)
    },
    [addFiles, closeModal],
  )

  const getFileSize = React.useCallback((file: File) => {
    const size = file.size
    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
    const decimals = i > 1 ? 1 : 0
    const formattedSize =
      (size / Math.pow(1024, i)).toFixed(decimals) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
    return formattedSize
  }, [])

  const totalFileCount = isInitializing ? initialFiles.length : forms.length

  return (
    <div
      className={[baseClass, showFiles && `${baseClass}__showingFiles`].filter(Boolean).join(' ')}
    >
      {breakpoints.m && showFiles ? <div className={`${baseClass}__mobileBlur`} /> : null}
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__headerTopRow`}>
          <div className={`${baseClass}__header__text`}>
            <ErrorPill count={totalErrorCount} i18n={i18n} withMessage />
            <p>
              <strong
                title={`${totalFileCount} ${t(totalFileCount > 1 ? 'upload:filesToUpload' : 'upload:fileToUpload')}`}
              >
                {totalFileCount}{' '}
                {t(totalFileCount > 1 ? 'upload:filesToUpload' : 'upload:fileToUpload')}
              </strong>
            </p>
          </div>

          <div className={`${baseClass}__header__actions`}>
            {(typeof maxFiles === 'number' ? totalFileCount < maxFiles : true) ? (
              <Pill
                className={`${baseClass}__header__addFile`}
                onClick={() => openModal(addMoreFilesDrawerSlug)}
              >
                {t('upload:addFile')}
              </Pill>
            ) : null}
            <Button
              buttonStyle="transparent"
              className={`${baseClass}__toggler`}
              onClick={() => setShowFiles((prev) => !prev)}
            >
              <span className={`${baseClass}__toggler__label`}>
                <strong
                  title={`${totalFileCount} ${t(totalFileCount > 1 ? 'upload:filesToUpload' : 'upload:fileToUpload')}`}
                >
                  {totalFileCount}{' '}
                  {t(totalFileCount > 1 ? 'upload:filesToUpload' : 'upload:fileToUpload')}
                </strong>
              </span>
              <ChevronIcon direction={showFiles ? 'down' : 'up'} />
            </Button>

            <Drawer gutter={false} Header={null} slug={addMoreFilesDrawerSlug}>
              <AddFilesView
                onCancel={() => closeModal(addMoreFilesDrawerSlug)}
                onDrop={handleAddFiles}
              />
            </Drawer>
          </div>
        </div>

        <div className={`${baseClass}__header__mobileDocActions`}>
          <Actions />
        </div>
      </div>

      <div className={`${baseClass}__animateWrapper`}>
        <AnimateHeight height={!breakpoints.m || showFiles ? 'auto' : 0}>
          <div className={`${baseClass}__filesContainer`}>
            {isInitializing && forms.length === 0 && initialFiles.length > 0
              ? Array.from(initialFiles).map((file, index) => (
                  <ShimmerEffect
                    animationDelay={`calc(${index} * ${60}ms)`}
                    height="35px"
                    key={index}
                  />
                ))
              : null}
            {forms.map(({ errorCount, formState }, index) => {
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
                  key={index}
                >
                  <button
                    className={`${baseClass}__fileRow`}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    <Thumbnail
                      className={`${baseClass}__thumbnail`}
                      fileSrc={isImage(currentFile.type) ? thumbnailUrls[index] : null}
                    />
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
        </AnimateHeight>
      </div>
    </div>
  )
}
