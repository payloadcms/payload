'use client'

import type { JsonObject } from 'payload'

import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { RelationshipContent } from '../RelationshipContent/index.js'
import { RowCard } from '../RowCard/index.js'
import './index.scss'

const baseClass = 'upload upload--has-one'

type Props = {
  readonly className?: string
  readonly fileDoc: {
    relationTo: string
    value: JsonObject
  }
  readonly onRemove?: () => void
}

export function UploadComponentHasOne2(props: Props) {
  const { className, fileDoc, onRemove } = props
  const { relationTo, value } = fileDoc
  const id = String(value.id)

  const { config } = useConfig()

  return (
    <RowCard className={[baseClass, className].filter(Boolean).join(' ')}>
      <RelationshipContent
        alt={(value?.alt || value?.filename) as string}
        byteSize={value.filesize as number}
        collectionSlug={relationTo}
        filename={value.filename as string}
        id={id}
        mimeType={value?.mimeType as string}
        onRemove={onRemove}
        src={`${config.serverURL}${value.url}`}
        x={value?.width as number}
        y={value?.height as number}
      />
    </RowCard>
  )
}
