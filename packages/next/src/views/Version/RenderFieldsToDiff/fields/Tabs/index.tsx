'use client'
import type {
  ClientTab,
  FieldDiffClientProps,
  TabsFieldClient,
  TabsFieldDiffClientComponent,
  VersionTab,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'tabs-diff'

export const Tabs: TabsFieldDiffClientComponent = (props) => {
  const { baseVersionField, comparisonValue, field, versionValue } = props
  const { selectedLocales } = useSelectedLocales()

  return (
    <div className={baseClass}>
      {baseVersionField.tabs.map((tab, i) => {
        if (!tab?.fields?.length) {
          return null
        }
        const fieldTab = field.tabs?.[i]
        return (
          <div className={`${baseClass}__tab`} key={i}>
            {(() => {
              if ('name' in fieldTab && selectedLocales && fieldTab.localized) {
                // Named localized tab
                return selectedLocales.map((locale, index) => {
                  const localizedTabProps = {
                    ...props,
                    comparison: comparisonValue?.[tab.name]?.[locale],
                    version: versionValue?.[tab.name]?.[locale],
                  }
                  return (
                    <div className={`${baseClass}__tab-locale`} key={[locale, index].join('-')}>
                      <div className={`${baseClass}__tab-locale-value`}>
                        <Tab
                          key={locale}
                          {...localizedTabProps}
                          fieldTab={fieldTab}
                          locale={locale}
                          tab={tab}
                        />
                      </div>
                    </div>
                  )
                })
              } else if ('name' in tab && tab.name) {
                // Named tab
                const namedTabProps = {
                  ...props,
                  comparison: comparisonValue?.[tab.name],
                  version: versionValue?.[tab.name],
                }
                return <Tab fieldTab={fieldTab} key={i} {...namedTabProps} tab={tab} />
              } else {
                // Unnamed tab
                return <Tab fieldTab={fieldTab} key={i} {...props} tab={tab} />
              }
            })()}
          </div>
        )
      })}
    </div>
  )
}

type TabProps = {
  fieldTab: ClientTab
  tab: VersionTab
} & FieldDiffClientProps<TabsFieldClient>

const Tab: React.FC<TabProps> = ({
  comparisonValue,
  fieldTab,
  locale,
  parentIsLocalized,
  tab,
  versionValue,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()

  if (!tab.fields?.length) {
    return null
  }

  return (
    <DiffCollapser
      comparison={comparisonValue}
      fields={fieldTab.fields}
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
      locales={selectedLocales}
      parentIsLocalized={parentIsLocalized || fieldTab.localized}
      version={versionValue}
    >
      <RenderVersionFieldsToDiff versionFields={tab.fields} />
    </DiffCollapser>
  )
}
