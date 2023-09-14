import React from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { useTranslation } from 'react-i18next'

import type { Props } from '../types'

import { getTranslation } from '../../../../../../../utilities/getTranslation'
import Label from '../../Label'
import { diffStyles } from '../styles'
import './index.scss'

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
  const { i18n, t } = useTranslation('general')

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
        {getTranslation(field.label, i18n)}
      </Label>
      <ReactDiffViewer
        compareMethod={DiffMethod[diffMethod]}
        hideLineNumbers
        newValue={typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder}
        oldValue={
          typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder
        }
        showDiffOnly={false}
        splitView
        styles={diffStyles}
      />
    </div>
  )
}

export default Text
