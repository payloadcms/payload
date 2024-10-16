'use client'

import type { JsonObject } from 'payload'

import React from 'react'

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
  readonly serverURL: string
}

export function UploadComponentHasOne(props: Props) {
  const { className, fileDoc, onRemove, readonly, serverURL } = props
  const { relationTo, value } = fileDoc
  const id = String(value?.id)

  const url: string = value.thumbnailURL || value.url
  let src: string

  try {
    src = new URL(url, serverURL).toString()
  } catch {
    src = `${serverURL}${url}`
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
        src={src}
        x={value?.width as number}
        y={value?.height as number}
      />
    </UploadCard>
  )
}
