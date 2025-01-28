'use client'
import type { ClientTab, TabsFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'
import './index.scss'

const baseClass = 'tabs-diff'

export const Tabs: React.FC<DiffComponentProps<TabsFieldClient>> = (props) => {
  const { comparison, field, locales, version } = props
  return (
    <div className={baseClass}>
      {field.tabs.map((tab, i) => {
        return (
          <div className={`${baseClass}__tab`} key={i}>
            {(() => {
              if ('name' in tab && locales && tab.localized) {
                // Named localized tab
                return locales.map((locale, index) => {
                  const localizedTabProps = {
                    ...props,
                    comparison: comparison?.[tab.name]?.[locale],
                    version: version?.[tab.name]?.[locale],
                  }
                  return (
                    <div className={`${baseClass}__tab-locale`} key={[locale, index].join('-')}>
                      <div className={`${baseClass}__tab-locale-value`}>
                        <Tab key={locale} {...localizedTabProps} locale={locale} tab={tab} />
                      </div>
                    </div>
                  )
                })
              } else if ('name' in tab && tab.name) {
                // Named tab
                const namedTabProps = {
                  ...props,
                  comparison: comparison?.[tab.name],
                  version: version?.[tab.name],
                }
                return <Tab key={i} {...namedTabProps} tab={tab} />
              } else {
                // Unnamed tab
                return <Tab key={i} {...props} tab={tab} />
              }
            })()}
          </div>
        )
      })}
    </div>
  )
}

type TabProps = {
  tab: ClientTab
} & DiffComponentProps<TabsFieldClient>

const Tab: React.FC<TabProps> = ({
  comparison,
  diffComponents,
  fieldPermissions,
  i18n,
  locale,
  locales,
  modifiedOnly,
  tab,
  version,
}) => {
  return (
    <DiffCollapser
      comparison={comparison}
      fields={tab.fields}
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
      locales={locales}
      version={version}
    >
      <RenderFieldsToDiff
        comparison={comparison}
        diffComponents={diffComponents}
        fieldPermissions={fieldPermissions}
        fields={tab.fields}
        i18n={i18n}
        locales={locales}
        modifiedOnly={modifiedOnly}
        version={version}
      />
    </DiffCollapser>
  )
}
