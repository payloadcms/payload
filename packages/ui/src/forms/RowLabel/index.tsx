import React from 'react'
import { Props, isComponent } from './types'
import getSiblingData from '../Form/getSiblingData'
import getDataByPath from '../Form/getDataByPath'
import { getTranslation } from '@payloadcms/translations'

const baseClass = 'row-label'

export const RowLabel: React.FC<Props> = (props) => {
  const { className, label, path, rowNumber, data: dataFromProps, i18n } = props

  const collapsibleData = getSiblingData(dataFromProps, path)
  const arrayData = getDataByPath(dataFromProps, path)
  const data = arrayData || collapsibleData

  if (isComponent(label)) {
    const Label = label
    return <Label data={data} index={rowNumber} path={path} />
  }

  return (
    <span
      className={[baseClass, className].filter(Boolean).join(' ')}
      style={{
        pointerEvents: 'none',
      }}
    >
      {typeof label === 'function'
        ? label({
            data,
            index: rowNumber,
            path,
          })
        : getTranslation(label, i18n)}
    </span>
  )
}
