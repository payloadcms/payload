'use client'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { VersionField } from '../../../buildVersionState.js'
import type { DiffComponentProps } from '../types.js'

import './index.scss'
import { RenderFieldsToDiff } from '../../index.js'
import Label from '../../Label/index.js'

const baseClass = 'nested-diff'

export const Nested: React.FC<
  {
    disableGutter?: boolean
    versionFields: VersionField[]
  } & Pick<DiffComponentProps, 'field' | 'locale'>
> = ({ disableGutter = false, field, locale, versionFields }) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      {'label' in field && field.label && typeof field.label !== 'function' && (
        <Label>
          {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
          {getTranslation(field.label, i18n)}
        </Label>
      )}
      <div
        className={[`${baseClass}__wrap`, !disableGutter && `${baseClass}__wrap--gutter`]
          .filter(Boolean)
          .join(' ')}
      >
        <RenderFieldsToDiff fields={versionFields} />
      </div>
    </div>
  )
}
