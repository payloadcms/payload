import React, { Fragment } from 'react'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import { Gutter } from '../Gutter'
import RenderTitle from '../RenderTitle'
import { DocumentTabs } from './Tabs'
import './index.scss'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  apiURL?: string
  collectionConfig?: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data?: any
  global?: SanitizedGlobalConfig
  id?: string
  isEditing?: boolean
}> = (props) => {
  const { id, apiURL, collectionConfig, customHeader, data, global, isEditing } = props

  return (
    <Gutter className={baseClass}>
      {customHeader && customHeader}
      {!customHeader && (
        <Fragment>
          <RenderTitle
            className={`${baseClass}__title`}
            useAsTitle={collectionConfig?.admin?.useAsTitle}
            globalLabel={global?.label}
            globalSlug={global?.slug}
            data={data}
            // fallback={`[${t('untitled')}]`}
            global={global}
          />
          <DocumentTabs
            apiURL={apiURL}
            // collection={collectionConfig}
            global={global}
            id={id}
            isEditing={isEditing}
          />
        </Fragment>
      )}
    </Gutter>
  )
}
