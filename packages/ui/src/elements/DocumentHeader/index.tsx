import React, { Fragment } from 'react'

import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import type { I18n } from '@payloadcms/translations'

import { Gutter } from '../Gutter'
import RenderTitle from '../RenderTitle'
import { DocumentTabs } from './Tabs'

import './index.scss'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
}> = (props) => {
  const { config, collectionConfig, customHeader, globalConfig, i18n } = props

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
            useAsTitle={collectionConfig?.admin?.useAsTitle}
            globalLabel={globalConfig?.label}
            globalSlug={globalConfig?.slug}
            isDate={titleFieldConfig?.type === 'date'}
            dateFormat={
              titleFieldConfig && 'date' in titleFieldConfig?.admin
                ? titleFieldConfig?.admin?.date?.displayFormat
                : undefined
            }
            fallback={`[${i18n.t('general:untitled')}]`}
          />
          <DocumentTabs
            config={config}
            collectionConfig={collectionConfig}
            globalConfig={globalConfig}
            i18n={i18n}
          />
        </Fragment>
      )}
    </Gutter>
  )
}
