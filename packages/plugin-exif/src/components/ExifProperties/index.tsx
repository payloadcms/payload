'use client'
import type { FormField } from 'payload'

import { useAllFormFields } from '@payloadcms/ui'
import React from 'react'

import { buildProperties } from '../../buildProperties.js'
import './index.scss'

const baseClass = 'exif-properties'

export const ExifProperties: React.FC<{ fieldName?: string }> = ({ fieldName = 'exif' }) => {
  const [fields] = useAllFormFields()

  const getValue = (path: string): unknown => (fields[path] as FormField | undefined)?.value

  const rows = buildProperties({
    exif: {
      location: getValue(`${fieldName}.location`) as [number, number] | null | undefined,
      raw: getValue(`${fieldName}.raw`) as null | Record<string, unknown> | undefined,
      takenAt: getValue(`${fieldName}.takenAt`) as null | string | undefined,
    },
    file: {
      filesize: getValue('filesize') as null | number | undefined,
      height: getValue('height') as null | number | undefined,
      mimeType: getValue('mimeType') as null | string | undefined,
      width: getValue('width') as null | number | undefined,
    },
  })

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>Properties</div>
      {rows.length === 0 ? (
        <p className={`${baseClass}__empty`}>No metadata available</p>
      ) : (
        <div className={`${baseClass}__table`}>
          <div className={`${baseClass}__row ${baseClass}__row--head`}>
            <span className={`${baseClass}__col-label`}>Property</span>
            <span className={`${baseClass}__col-label`}>Value</span>
          </div>
          {rows.map((row) => (
            <div className={`${baseClass}__row`} key={row.label}>
              <span className={`${baseClass}__label`}>{row.label}</span>
              <span className={`${baseClass}__value`}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
