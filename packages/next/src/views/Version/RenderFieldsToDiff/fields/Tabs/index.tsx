import type { MappedField, TabsFieldProps } from '@payloadcms/ui/client'

import React from 'react'

import type { Props } from '../types.js'

import RenderFieldsToDiff from '../../index.js'
import Nested from '../Nested/index.js'

const baseClass = 'tabs-diff'

const Tabs: React.FC<
  Omit<Props, 'field'> & {
    field: MappedField & TabsFieldProps
  }
> = ({ comparison, diffComponents, field, i18n, locale, locales, permissions, version }) => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        {field.tabs.map((tab, i) => {
          if ('name' in tab) {
            return (
              <Nested
                comparison={comparison?.[tab.name]}
                diffComponents={diffComponents}
                field={field}
                fieldMap={tab.fieldMap}
                i18n={i18n}
                key={i}
                locale={locale}
                locales={locales}
                permissions={permissions}
                version={version?.[tab.name]}
              />
            )
          }

          return (
            <RenderFieldsToDiff
              comparison={comparison}
              diffComponents={diffComponents}
              fieldMap={tab.fieldMap}
              fieldPermissions={permissions}
              i18n={i18n}
              key={i}
              locales={locales}
              version={version}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Tabs
