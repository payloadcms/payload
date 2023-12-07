import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import './index.scss'
import { isComponent } from './types'

const baseClass = 'field-description'

const FieldDescription: React.FC<Props> = (props) => {
  const { className, description, marginPlacement, path, value } = props

  const { i18n } = useTranslation()

  if (isComponent(description)) {
    const Description = description
    return <Description path={path} value={value} />
  }

  if (description) {
    return (
      <div
        className={[
          baseClass,
          className,
          marginPlacement && `${baseClass}--margin-${marginPlacement}`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {typeof description === 'function'
          ? description({ path, value })
          : getTranslation(description, i18n)}
      </div>
    )
  }

  return null
}

export default FieldDescription
