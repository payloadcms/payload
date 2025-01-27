import React from 'react'
import { useTranslation } from 'react-i18next'

import type { CheckboxField } from '../../../../../../../../exports/types'
import type { CellComponentProps } from '../../types'

import './index.scss'

// Handles boolean values
const Checkbox: React.FC<CellComponentProps<CheckboxField>> = ({ data }) => {
  const { t } = useTranslation('general')
  if (typeof data !== 'boolean') return null
  return (
    <code className="bool-cell">
      <span>{t(`${data}`).toLowerCase()}</span>
    </code>
  )
}
export default Checkbox
