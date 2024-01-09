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
  apiURL?: string
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data?: any
  globalConfig?: SanitizedGlobalConfig
  id?: string
  isEditing?: boolean
  i18n: I18n
}> = (props) => {
  const {
    id,
    apiURL,
    config,
    collectionConfig,
    customHeader,
    data,
    globalConfig,
    isEditing,
    i18n,
  } = props

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
            data={data}
            isDate={titleFieldConfig?.type === 'date'}
            dateFormat={
              titleFieldConfig && 'date' in titleFieldConfig?.admin
                ? titleFieldConfig?.admin?.date?.displayFormat
                : undefined
            }
            fallback={`[${i18n.t('general:untitled')}]`}
          />
          <DocumentTabs
            apiURL={apiURL}
            config={config}
            collectionConfig={collectionConfig}
            globalConfig={globalConfig}
            id={id}
            isEditing={isEditing}
            i18n={i18n}
          />
        </Fragment>
      )}
    </Gutter>
  )
}
