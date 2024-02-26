import type { I18n } from '@payloadcms/translations'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import React, { Fragment } from 'react'

import { Gutter } from '../Gutter'
import RenderTitle from '../RenderTitle'
import { DocumentTabs } from './Tabs'
import './index.scss'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  customHeader?: React.ReactNode
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
}> = (props) => {
  const { collectionConfig, config, customHeader, globalConfig, i18n } = props

  const titleFieldConfig = collectionConfig?.fields?.find(
    (f) => 'name' in f && f?.name === collectionConfig?.admin?.useAsTitle,
  )

  return (
    <Gutter className={baseClass}>
      {customHeader && customHeader}
      {!customHeader && (
        <Fragment>
          <RenderTitle
            className={`${baseClass}__title`}
            dateFormat={
              titleFieldConfig && 'date' in titleFieldConfig?.admin
                ? titleFieldConfig?.admin?.date?.displayFormat
                : undefined
            }
            fallback={`[${i18n.t('general:untitled')}]`}
            isDate={titleFieldConfig?.type === 'date'}
          />
          <DocumentTabs
            collectionConfig={collectionConfig}
            config={config}
            globalConfig={globalConfig}
            i18n={i18n}
          />
        </Fragment>
      )}
    </Gutter>
  )
}
