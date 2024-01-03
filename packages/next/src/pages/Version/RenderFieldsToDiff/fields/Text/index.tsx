import React from 'react'

import type { Props } from '../types'

import { getTranslation } from 'payload/utilities'
import Label from '../../Label'
import { diffStyles } from '../styles'
import './index.scss'
import { DiffViewer } from './DiffViewer'

const baseClass = 'text-diff'

const Text: React.FC<Props> = ({
  comparison,
  diffMethod,
  field,
  isRichText = false,
  locale,
  version,
}) => {
  let placeholder = ''
  const t = (key: string) => key // TODO
  const i18n = {} // TODO

  if (version === comparison) placeholder = `[${t('noValue')}]`

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
        {typeof field.label === 'string' ? field.label : '[field-label]' /* TODO */}
        {/* {getTranslation(field.label, i18n)} */}
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
