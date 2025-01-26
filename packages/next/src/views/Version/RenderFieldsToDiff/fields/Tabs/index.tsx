'use client'
import type { TabsFieldClient } from 'payload'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import RenderFieldsToDiff from '../../index.js'
import Nested from '../Nested/index.js'

const baseClass = 'tabs-diff'

const Tabs: React.FC<DiffComponentProps<TabsFieldClient>> = ({
  comparison,
  diffComponents,
  field,
  fieldPermissions,
  locale,
  locales,
  version,
  versionField,
}) => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        {versionField.tabs.map((tab, i) => {
          if ('name' in tab) {
            return <Nested field={field} key={i} locale={locale} versionFields={tab.fields} />
          }

          return <RenderFieldsToDiff fields={versionField.fields} key={i} />
        })}
      </div>
    </div>
  )
}

export default Tabs
