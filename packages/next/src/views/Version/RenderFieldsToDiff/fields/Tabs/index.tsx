'use client'
import type { TabsFieldClient } from 'payload'

import React from 'react'

import type { DiffComponentProps } from '../types.js'

import RenderFieldsToDiff from '../../index.js'
import Nested from '../Nested/index.js'

const baseClass = 'tabs-diff'

const Tabs: React.FC<DiffComponentProps<TabsFieldClient>> = ({
  comparison,
  diffComponents,
  field,
  i18n,
  locale,
  locales,
  modifiedOnly,
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
                fields={tab.fields}
                i18n={i18n}
                key={i}
                locale={locale}
                locales={locales}
                modifiedOnly
                permissions={permissions}
                version={version?.[tab.name]}
              />
            )
          }

          return (
            <RenderFieldsToDiff
              comparison={comparison}
              diffComponents={diffComponents}
              fieldPermissions={permissions}
              fields={tab.fields}
              i18n={i18n}
              key={i}
              locales={locales}
              modifiedOnly
              version={version}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Tabs
