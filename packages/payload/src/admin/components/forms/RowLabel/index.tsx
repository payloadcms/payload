import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { useWatchForm } from '../Form/context'
import { isComponent } from './types'

const baseClass = 'row-label'

export const RowLabel: React.FC<Props> = ({ className, ...rest }) => {
  return (
    <span
      className={[baseClass, className].filter(Boolean).join(' ')}
      style={{
        pointerEvents: 'none',
      }}
    >
      <RowLabelContent {...rest} />
    </span>
  )
}

const RowLabelContent: React.FC<Omit<Props, 'className'>> = (props) => {
  const { label, path, rowNumber } = props

  const { i18n } = useTranslation()
  const { getDataByPath, getSiblingData } = useWatchForm()
  const collapsibleData = getSiblingData(path)
  const arrayData = getDataByPath(path)
  const data = arrayData || collapsibleData

  if (isComponent(label)) {
    const Label = label
    return <Label data={data} index={rowNumber} path={path} />
  }

  return (
    <React.Fragment>
      {typeof label === 'function'
        ? label({
            data,
            index: rowNumber,
            path,
          })
        : getTranslation(label, i18n)}
    </React.Fragment>
  )
}
