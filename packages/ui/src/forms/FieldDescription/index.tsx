import React from 'react'

import type { Props } from './types'

// import { getTranslation } from '@payloadcms/translations'
import { isComponent } from './types'
import './index.scss'

const baseClass = 'field-description'

const FieldDescription: React.FC<Props> = (props) => {
  const { className, description, marginPlacement, path, value } = props

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
        {
          typeof description === 'function'
            ? description({
                path,
                value,
              })
            : '' // : getTranslation(description, i18n)
        }
      </div>
    )
  }

  return null
}

export default FieldDescription
