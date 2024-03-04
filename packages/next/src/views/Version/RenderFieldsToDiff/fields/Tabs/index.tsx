import React from 'react'

import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import Nested from '../Nested'

const baseClass = 'tabs-diff'

const Tabs: React.FC<Props> = ({
  comparison,
  diffComponents,
  field,
  i18n,
  locale,
  locales,
  permissions,
  version,
}) => {
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
                fieldMap={tab.subfields}
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
              fieldMap={tab.subfields}
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
