'use client'

import type { JsonObject } from 'payload'

import { getBestFitFromSizes, isImage } from 'payload/shared'
import React from 'react'

import type { ReloadDoc } from '../types.js'

import './index.scss'
import { RelationshipContent } from '../RelationshipContent/index.js'
import { UploadCard } from '../UploadCard/index.js'

const baseClass = 'upload upload--has-one'

type Props = {
  readonly className?: string
  readonly displayPreview?: boolean
  readonly fileDoc: {
    relationTo: string
    value: JsonObject
  }
  readonly onRemove?: () => void
  readonly readonly?: boolean
  readonly reloadDoc: ReloadDoc
  readonly serverURL: string
  readonly showCollectionSlug?: boolean
}

export function UploadComponentHasOne(props: Props) {
  const {
    className,
    displayPreview,
    fileDoc,
    onRemove,
    readonly,
    reloadDoc,
    serverURL,
    showCollectionSlug = false,
  } = props
  const { relationTo, value } = fileDoc
  const id = String(value?.id)

  let src: string
  let thumbnailSrc: string

  if (value.url) {
    try {
      src = new URL(value.url, serverURL).toString()
    } catch {
      src = `${serverURL}${value.url}`
    }
  }

  if (value.thumbnailURL) {
    try {
      thumbnailSrc = new URL(value.thumbnailURL, serverURL).toString()
    } catch {
      thumbnailSrc = `${serverURL}${value.thumbnailURL}`
    }
  }

  if (isImage(value.mimeType)) {
    thumbnailSrc = getBestFitFromSizes({
      sizes: value.sizes,
      thumbnailURL: thumbnailSrc,
      url: src,
      width: value.width,
    })
  }

  return (
    <UploadCard className={[baseClass, className].filter(Boolean).join(' ')}>
      <RelationshipContent
        allowEdit={!readonly}
        allowRemove={!readonly}
        alt={(value?.alt || value?.filename) as string}
        byteSize={value.filesize as number}
        collectionSlug={relationTo}
        displayPreview={displayPreview}
        filename={value.filename as string}
        id={id}
        mimeType={value?.mimeType as string}
        onRemove={onRemove}
        reloadDoc={reloadDoc}
        showCollectionSlug={showCollectionSlug}
        src={src}
        thumbnailSrc={thumbnailSrc}
        x={value?.width as number}
        y={value?.height as number}
      />
    </UploadCard>
  )
}
