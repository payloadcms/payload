import React from 'react'

import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import Nested from '../Nested'

const baseClass = 'tabs-diff'

const Tabs: React.FC<Props> = ({
  comparison,
  field,
  locales,
  permissions,
  version,
  i18n,
  locale,
  diffComponents,
}) => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        {field.tabs.map((tab, i) => {
          if ('name' in tab) {
            return (
              <Nested
                comparison={comparison?.[tab.name]}
                fieldMap={tab.subfields}
                key={i}
                locales={locales}
                permissions={permissions}
                version={version?.[tab.name]}
                i18n={i18n}
                locale={locale}
                field={field}
                diffComponents={diffComponents}
              />
            )
          }

          return (
            <RenderFieldsToDiff
              comparison={comparison}
              fieldMap={tab.subfields}
              fieldPermissions={permissions}
              key={i}
              locales={locales}
              version={version}
              i18n={i18n}
              diffComponents={diffComponents}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Tabs
