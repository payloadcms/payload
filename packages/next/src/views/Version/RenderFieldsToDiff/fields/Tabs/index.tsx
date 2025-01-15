'use client'
import type { TabsFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import RenderFieldsToDiff from '../../index.js'

const baseClass = 'tabs-diff'

const Tabs: React.FC<DiffComponentProps<TabsFieldClient>> = ({
  comparison,
  diffComponents,
  field,
  fieldPermissions,
  i18n,
  locale,
  locales,
  version,
}) => {
  return (
    <div className={baseClass}>
      {field.tabs.map((tab, i) => {
        const comparisonUnwrapped = 'name' in tab ? comparison?.[tab.name] : comparison
        const versionUnwrapped = 'name' in tab ? version?.[tab.name] : version

        return (
          <DiffCollapser
            comparison={comparisonUnwrapped}
            fields={tab.fields}
            key={i}
            label={
              'label' in tab &&
              tab.label &&
              typeof tab.label !== 'function' && (
                <span>
                  {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
                  {getTranslation(tab.label, i18n)}
                </span>
              )
            }
            version={versionUnwrapped}
          >
            <RenderFieldsToDiff
              comparison={comparisonUnwrapped}
              diffComponents={diffComponents}
              fieldPermissions={fieldPermissions}
              fields={tab.fields}
              i18n={i18n}
              key={i}
              locales={locales}
              version={versionUnwrapped}
            />
          </DiffCollapser>
        )
      })}
    </div>
  )
}

export default Tabs
