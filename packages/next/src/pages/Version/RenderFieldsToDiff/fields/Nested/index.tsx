import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import Label from '../../Label'
import './index.scss'

const baseClass = 'nested-diff'

const Nested: React.FC<Props> = ({
  comparison,
  diffComponents,
  disableGutter = false,
  field,
  fieldMap,
  i18n,
  locale,
  locales,
  permissions,
  version,
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
          diffComponents={diffComponents}
          fieldMap={fieldMap}
          fieldPermissions={permissions}
          i18n={i18n}
          locales={locales}
          version={version}
        />
      </div>
    </div>
  )
}

export default Nested
