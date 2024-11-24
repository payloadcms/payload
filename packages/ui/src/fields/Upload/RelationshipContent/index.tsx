'use client'

import type { TypeWithID } from 'payload'

import { formatFilesize } from 'payload/shared'
import React from 'react'

import type { ReloadDoc } from '../types.js'

import { Button } from '../../../elements/Button/index.js'
import { useDocumentDrawer } from '../../../elements/DocumentDrawer/index.js'
import { ThumbnailComponent } from '../../../elements/Thumbnail/index.js'
import './index.scss'

const baseClass = 'upload-relationship-details'

type Props = {
  readonly allowEdit?: boolean
  readonly allowRemove?: boolean
  readonly alt: string
  readonly byteSize: number
  readonly className?: string
  readonly collectionSlug: string
  readonly filename: string
  readonly id?: number | string
  readonly mimeType: string
  readonly onRemove: () => void
  readonly reloadDoc: ReloadDoc
  readonly src: string
  readonly withMeta?: boolean
  readonly x?: number
  readonly y?: number
}
export function RelationshipContent(props: Props) {
  const {
    id,
    allowEdit,
    allowRemove,
    alt,
    byteSize,
    className,
    collectionSlug,
    filename,
    mimeType,
    onRemove,
    reloadDoc,
    src,
    withMeta = true,
    x,
    y,
  } = props

  const [DocumentDrawer, _, { openDrawer }] = useDocumentDrawer({
    id: src ? id : undefined,
    collectionSlug,
  })

  const onSave = React.useCallback(
    async ({ doc }: { doc: TypeWithID }) => reloadDoc(doc.id, collectionSlug),
    [reloadDoc, collectionSlug],
  )

  function generateMetaText(mimeType: string, size: number): string {
    const sections: string[] = []
    if (mimeType?.includes('image')) {
      sections.push(formatFilesize(size))
    }

    if (x && y) {
      sections.push(`${x}x${y}`)
    }

    if (mimeType) {
      sections.push(mimeType)
    }

    return sections.join(' — ')
  }

  const metaText = withMeta ? generateMetaText(mimeType, byteSize) : ''

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__imageAndDetails`}>
        <ThumbnailComponent
          alt={alt}
          className={`${baseClass}__thumbnail`}
          filename={filename}
          fileSrc={src}
          size="small"
        />
        <div className={`${baseClass}__details`}>
          <p className={`${baseClass}__filename`}>
            {src ? (
              <a href={src} target="_blank">
                {filename}
              </a>
            ) : (
              filename
            )}
          </p>
          {withMeta ? <p className={`${baseClass}__meta`}>{metaText}</p> : null}
        </div>
      </div>

      {allowEdit !== false || allowRemove !== false ? (
        <div className={`${baseClass}__actions`}>
          {allowEdit !== false ? (
            <Button
              buttonStyle="icon-label"
              className={`${baseClass}__edit`}
              icon="edit"
              iconStyle="none"
              onClick={openDrawer}
            />
          ) : null}
          {allowRemove !== false ? (
            <Button
              buttonStyle="icon-label"
              className={`${baseClass}__remove`}
              icon="x"
              iconStyle="none"
              onClick={() => onRemove()}
            />
          ) : null}
          <DocumentDrawer onSave={onSave} />
        </div>
      ) : null}
    </div>
  )
}
