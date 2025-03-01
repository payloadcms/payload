'use client'

import type { JsonObject } from 'payload'

import React from 'react'

import type { ReloadDoc } from '../types.js'

import { RelationshipContent } from '../RelationshipContent/index.js'
import { UploadCard } from '../UploadCard/index.js'
import './index.scss'

const baseClass = 'upload upload--has-one'

type Props = {
  readonly className?: string
  readonly fileDoc: {
    relationTo: string
    value: JsonObject
  }
  readonly onRemove?: () => void
  readonly readonly?: boolean
  readonly reloadDoc: ReloadDoc
  readonly serverURL: string
}

export function UploadComponentHasOne(props: Props) {
  const { className, fileDoc, onRemove, readonly, reloadDoc, serverURL } = props
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

  return (
    <UploadCard className={[baseClass, className].filter(Boolean).join(' ')}>
      <RelationshipContent
        allowEdit={!readonly}
        allowRemove={!readonly}
        alt={(value?.alt || value?.filename) as string}
        byteSize={value.filesize as number}
        collectionSlug={relationTo}
        filename={value.filename as string}
        id={id}
        mimeType={value?.mimeType as string}
        onRemove={onRemove}
        reloadDoc={reloadDoc}
        src={src}
        thumbnailSrc={thumbnailSrc || src}
        x={value?.width as number}
        y={value?.height as number}
      />
    </UploadCard>
  )
}
