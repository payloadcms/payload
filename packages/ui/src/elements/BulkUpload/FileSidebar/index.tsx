'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Drawer } from '../../Drawer/index.js'
import { ErrorPill } from '../../ErrorPill/index.js'
import { Pill } from '../../Pill/index.js'
import { AddFilesView } from '../AddFilesView/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { strings } from '../strings.js'
import './index.scss'

const drawerSlug = 'bulk-upload-drawer--add-more-files'

const baseClass = 'file-selections'

export function FileSidebar() {
  const { activeIndex, addFiles, forms, removeFile, setActiveIndex, totalErrorCount } =
    useFormsManager()
  const { i18n, t } = useTranslation()
  const { closeModal, openModal } = useModal()

  const handleRemoveFile = React.useCallback(
    (indexToRemove: number) => {
      removeFile(indexToRemove)
    },
    [removeFile],
  )

  const handleAddFiles = React.useCallback(
    (filelist: FileList) => {
      addFiles(filelist)
      closeModal(drawerSlug)
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

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header__text`}>
          <ErrorPill count={totalErrorCount} i18n={i18n} withMessage />
          <p>
            <strong title={`${forms.length} ${strings.filesToUpload}`}>
              {forms.length} {strings.filesToUpload}
            </strong>
          </p>
        </div>

        <Pill onClick={() => openModal(drawerSlug)}>{t('upload:addFile')}</Pill>
        <Drawer Header={null} gutter={false} slug={drawerSlug}>
          <AddFilesView onDrop={handleAddFiles} />
        </Drawer>
      </div>

      <div className={`${baseClass}__filesContainer`}>
        {forms.map(({ errorCount, formState }, index) => {
          const currentFile = formState.file.value as File

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
                <img alt={currentFile.name} src={URL.createObjectURL(currentFile)} />
                <div className={`${baseClass}__fileDetails`}>
                  <p className={`${baseClass}__fileName`} title={currentFile.name}>
                    {currentFile.name}
                  </p>
                </div>
                <p className={`${baseClass}__fileSize`}>{getFileSize(currentFile)}</p>
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
  )
}
