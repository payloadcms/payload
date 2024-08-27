'use client'

import { formatFilesize } from 'payload/shared'
import React from 'react'

import { Button } from '../../Button/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { ThumbnailComponent } from '../../Thumbnail/index.js'
import './index.scss'

const baseClass = 'uploadDocRelationshipContent'

type Props = {
  readonly alt: string
  readonly byteSize: number
  readonly className?: string
  readonly collectionSlug: string
  readonly filename: string
  readonly id: number | string
  readonly mimeType: string
  readonly onRemove: () => void
  readonly src: string
  readonly withMeta?: boolean
  readonly x?: number
  readonly y?: number
}
export function UploadDocRelationship(props: Props) {
  const {
    id,
    alt,
    byteSize,
    className,
    collectionSlug,
    filename,
    mimeType,
    onRemove,
    src,
    withMeta = true,
    x,
    y,
  } = props

  const [DocumentDrawer, _, { openDrawer }] = useDocumentDrawer({
    id,
    collectionSlug,
  })

  function generateMetaText(mimeType: string, size: number): string {
    const sections: string[] = []
    if (mimeType.includes('image')) {
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
          fileSrc={src}
          filename={filename}
          size="small"
        />
        <div className={`${baseClass}__details`}>
          <p className={`${baseClass}__title`}>{filename}</p>
          {withMeta ? <p className={`${baseClass}__meta`}>{metaText}</p> : null}
        </div>
      </div>

      <div>
        <Button buttonStyle="icon-label" icon="edit" iconStyle="none" onClick={openDrawer} round />
        <Button
          buttonStyle="icon-label"
          className={`${baseClass}__button`}
          icon="x"
          iconStyle="none"
          onClick={onRemove}
          round
        />
        <DocumentDrawer />
      </div>
    </div>
  )
}
