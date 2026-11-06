'use client'

import { validateMimeType } from 'payload/shared'
import React, { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentLayout } from '../../elements/LayoutToggle/index.js'
import type { CollectionPreviewPreferences } from './preferences.js'
import type { CollectionPreviewProps } from './types.js'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { DocumentCard } from '../../elements/DocumentCard/index.js'
import { LayoutToggle } from '../../elements/LayoutToggle/index.js'
import { Link } from '../../elements/Link/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { TableIdentityProvider } from '../../elements/Table/TableIdentity.js'
import { DocumentPlaceholder } from '../../graphics/DocumentPlaceholder/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { UploadIcon } from '../../icons/Upload/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { getColumnCount } from './getColumnCount.js'
import { hasDraggedFiles } from './hasDraggedFiles.js'
import { getCollectionPreviewPreferenceKey } from './preferences.js'
import './index.css'

export function CollectionPreviewClient({
  collectionSlug,
  createHref,
  createLabel,
  description,
  documents,
  emptyLabel,
  href,
  initialLayout = 'grid',
  isAuth,
  isBulkUploadEnabled = false,
  label,
  loadError,
  mimeTypes,
  table,
}: CollectionPreviewProps) {
  const {
    modalSlug,
    setCollectionSlug,
    setInitialFiles,
    setInitialForms,
    setOnSuccess,
    setParentID,
    setSelectableCollections,
  } = useBulkUpload()
  const { openModal } = useModal()
  const router = useRouter()
  const { setPreference } = usePreferences()
  const preferenceKey = getCollectionPreviewPreferenceKey({ collectionSlug })
  const { t } = useTranslation()
  const dragDepth = useRef(0)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const canDropFiles = isBulkUploadEnabled && Boolean(createHref)
  const headingID = useId()
  const [layout, setLayout] = useState<DocumentLayout>(initialLayout)
  const rowRef = useRef<HTMLUListElement>(null)
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const row = rowRef.current
    if (!row) {
      return
    }

    const updateColumns = () => {
      const styles = getComputedStyle(row)
      setColumns(
        getColumnCount({
          gap: parseFloat(styles.columnGap) || 0,
          width: row.clientWidth,
        }),
      )
    }
    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(row)
    return () => observer.disconnect()
  }, [layout, loadError])

  useEffect(() => {
    const resetDrag = () => {
      dragDepth.current = 0
      setIsDraggingFiles(false)
    }

    if (!canDropFiles) {
      resetDrag()
      return
    }

    window.addEventListener('dragend', resetDrag)
    window.addEventListener('drop', resetDrag)
    window.addEventListener('blur', resetDrag)
    return () => {
      window.removeEventListener('dragend', resetDrag)
      window.removeEventListener('drop', resetDrag)
      window.removeEventListener('blur', resetDrag)
    }
  }, [canDropFiles])

  const handleLayoutChange = async (nextLayout: DocumentLayout) => {
    setLayout(nextLayout)
    try {
      await setPreference<CollectionPreviewPreferences>(preferenceKey, (preferences) => ({
        ...preferences,
        documentLayout: nextLayout,
      }))
    } catch {
      toast.error(t('error:unknown'))
    }
  }

  const handleBulkUpload = ({ files }: { files?: FileList } = {}) => {
    setCollectionSlug(collectionSlug)
    setSelectableCollections([collectionSlug])
    setParentID(undefined)
    setInitialFiles(files)
    setInitialForms(undefined)
    setOnSuccess(() => router.refresh())
    openModal(modalSlug)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
    if (!canDropFiles || !hasDraggedFiles({ dataTransfer: event.dataTransfer })) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current += 1
    setIsDraggingFiles(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    if (!dragDepth.current) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (!dragDepth.current) {
      setIsDraggingFiles(false)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!canDropFiles || !hasDraggedFiles({ dataTransfer: event.dataTransfer })) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    dragDepth.current = Math.max(1, dragDepth.current)
    setIsDraggingFiles(true)
  }

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    if (!canDropFiles || !event.dataTransfer.files.length) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = 0
    setIsDraggingFiles(false)

    const { files } = event.dataTransfer
    if (
      mimeTypes?.length &&
      !Array.from(files).every((file) => validateMimeType(file.type, mimeTypes))
    ) {
      toast.error(t('error:invalidFileType'))
      return
    }
    const transfer = new DataTransfer()
    for (const file of Array.from(files)) {
      transfer.items.add(file)
    }
    handleBulkUpload({ files: transfer.files })
  }

  return (
    <section
      aria-labelledby={headingID}
      className={['collection-preview', isDraggingFiles && 'collection-preview--dragging']
        .filter(Boolean)
        .join(' ')}
      onDragEnterCapture={handleDragEnter}
      onDragLeaveCapture={handleDragLeave}
      onDragOverCapture={handleDragOver}
      onDropCapture={handleDrop}
    >
      <div className="collection-preview__header">
        <h2 className="collection-preview__heading" id={headingID}>
          <Link className="collection-preview__heading-link" href={href}>
            {label}
            <span aria-hidden="true" className="collection-preview__heading-chevron">
              <ChevronIcon direction="right" />
            </span>
          </Link>
        </h2>
        <div className="collection-preview__actions">
          {createHref ? (
            <Button
              aria-haspopup={isBulkUploadEnabled ? 'dialog' : undefined}
              aria-label={`${createLabel}: ${label}`}
              buttonStyle="secondary"
              el={isBulkUploadEnabled ? 'button' : 'link'}
              icon={isBulkUploadEnabled ? <UploadIcon /> : 'plus'}
              iconPosition="left"
              margin={false}
              onClick={isBulkUploadEnabled ? () => handleBulkUpload() : undefined}
              to={isBulkUploadEnabled ? undefined : createHref}
            >
              {createLabel}
            </Button>
          ) : null}
          <LayoutToggle layout={layout} onChange={handleLayoutChange} />
        </div>
      </div>
      {loadError ? <p role="status">{loadError}</p> : null}
      {!loadError && layout === 'table' ? (
        <div className="collection-preview__table">
          <TableIdentityProvider collectionSlug={collectionSlug}>
            <RelationshipProvider>{table}</RelationshipProvider>
          </TableIdentityProvider>
          {!documents.length ? (
            <p className="collection-preview__table-empty">{emptyLabel}</p>
          ) : null}
        </div>
      ) : null}
      {!loadError && layout === 'grid' ? (
        <ul
          className="collection-preview__row"
          ref={rowRef}
          style={{ '--collection-preview-columns': columns } as React.CSSProperties}
        >
          {Array.from({ length: columns }, (_, index) => {
            const doc = documents[index]
            const isEmpty = !documents.length && index === 0
            return (
              <li key={doc?.id ?? `empty-${index}`}>
                {doc ? (
                  <DocumentCard
                    href={doc.href}
                    placeholder={<DocumentPlaceholder variant={isAuth ? 'auth' : 'document'} />}
                    thumbnail={doc.thumbnailURL ? { alt: '', src: doc.thumbnailURL } : undefined}
                    title={doc.title}
                  >
                    <div className="collection-preview__metadata">
                      {label}
                      {doc.dateLabel ? (
                        <>
                          {' '}
                          · <time dateTime={doc.dateTime}>{doc.dateLabel}</time>
                        </>
                      ) : null}
                    </div>
                  </DocumentCard>
                ) : (
                  <div
                    className={[
                      'collection-preview__empty-card',
                      isEmpty && 'collection-preview__empty-card--first',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div aria-hidden="true" className="collection-preview__thumbnail-sizing" />
                    <div aria-hidden="true" className="collection-preview__content-sizing" />
                    <div className="collection-preview__empty-content">
                      {createHref && index === documents.length ? (
                        <>
                          <Button
                            aria-haspopup={isBulkUploadEnabled ? 'dialog' : undefined}
                            aria-label={`${createLabel}: ${label}`}
                            buttonStyle="secondary"
                            className="collection-preview__create"
                            el={isBulkUploadEnabled ? 'button' : 'link'}
                            icon={
                              isBulkUploadEnabled ? <UploadIcon /> : isEmpty ? undefined : 'plus'
                            }
                            iconPosition="left"
                            margin={false}
                            onClick={isBulkUploadEnabled ? () => handleBulkUpload() : undefined}
                            to={isBulkUploadEnabled ? undefined : createHref}
                          >
                            {createLabel}
                          </Button>
                          {isBulkUploadEnabled ? <p>{t('upload:dragAndDropHere')}</p> : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
      {description ? <div className="collection-preview__description">{description}</div> : null}
      {isDraggingFiles ? (
        <div className="collection-preview__drop-overlay" role="status">
          <UploadIcon />
          <span>{t('dashboard:widgetDropFilesToUpload')}</span>
        </div>
      ) : null}
    </section>
  )
}
