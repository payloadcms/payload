import React from 'react'
import { getTranslation } from '@payloadcms/translations'

import type { Props } from '../types'

import Label from '../../Label'
import { diffStyles } from '../styles'
import { DiffViewer } from './DiffViewer'

import './index.scss'

const baseClass = 'text-diff'

const Text: React.FC<Props> = ({
  comparison,
  diffMethod,
  field,
  isRichText = false,
  locale,
  version,
  i18n,
}) => {
  let placeholder = ''

  if (version === comparison) placeholder = `[${i18n.t('general:noValue')}]`

  let versionToRender = version
  let comparisonToRender = comparison

  if (isRichText) {
    if (typeof version === 'object') versionToRender = JSON.stringify(version, null, 2)
    if (typeof comparison === 'object') comparisonToRender = JSON.stringify(comparison, null, 2)
  }

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(field?.label || '', i18n)}
      </Label>
      <DiffViewer
        comparisonToRender={comparisonToRender}
        diffMethod={diffMethod}
        placeholder={placeholder}
        versionToRender={versionToRender}
        diffStyles={diffStyles}
      />
    </div>
  )
}

export default Text
