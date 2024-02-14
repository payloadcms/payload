import React from 'react'
import { getTranslation } from '@payloadcms/translations'

import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import Label from '../../Label'
import './index.scss'

const baseClass = 'nested-diff'

const Nested: React.FC<Props> = ({
  comparison,
  disableGutter = false,
  field,
  locale,
  locales,
  permissions,
  version,
  i18n,
  fieldMap,
  diffComponents,
}) => {
  return (
    <div className={baseClass}>
      {field.label && (
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
        <RenderFieldsToDiff
          comparison={comparison}
          fieldMap={fieldMap}
          fieldPermissions={permissions}
          locales={locales}
          version={version}
          i18n={i18n}
          diffComponents={diffComponents}
        />
      </div>
    </div>
  )
}

export default Nested
