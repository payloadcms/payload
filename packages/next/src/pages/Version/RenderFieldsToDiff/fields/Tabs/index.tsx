import React from 'react'

import type { TabsField } from 'payload/types'
import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import Nested from '../Nested'

const baseClass = 'tabs-diff'

const Tabs: React.FC<Props & { field: TabsField }> = ({
  comparison,
  field,
  fieldComponents,
  locales,
  permissions,
  version,
  i18n,
  config,
  locale,
}) => (
  <div className={baseClass}>
    <div className={`${baseClass}__wrap`}>
      {field.tabs.map((tab, i) => {
        if ('name' in tab) {
          return (
            <Nested
              comparison={comparison?.[tab.name]}
              field={tab}
              fieldComponents={fieldComponents}
              key={i}
              locales={locales}
              permissions={permissions}
              version={version?.[tab.name]}
              i18n={i18n}
              config={config}
              locale={locale}
            />
          )
        }

        return (
          <RenderFieldsToDiff
            comparison={comparison}
            fieldComponents={fieldComponents}
            fieldPermissions={permissions}
            fields={tab.fields}
            key={i}
            locales={locales}
            version={version}
            i18n={i18n}
            config={config}
            locale={locale}
          />
        )
      })}
    </div>
  </div>
)

export default Tabs
