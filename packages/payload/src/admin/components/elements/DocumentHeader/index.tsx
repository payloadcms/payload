import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../exports/types'

import { Gutter } from '../Gutter'
import RenderTitle from '../RenderTitle'
import { DocumentTabs } from './Tabs'
import './index.scss'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  apiURL?: string
  collection?: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data?: any
  global?: SanitizedGlobalConfig
  id?: string
  isEditing?: boolean
}> = (props) => {
  const { id, apiURL, collection, customHeader, data, global, isEditing } = props
  const { t } = useTranslation('general')

  return (
    <Gutter className={baseClass}>
      {customHeader && customHeader}
      {!customHeader && (
        <Fragment>
          <RenderTitle
            className={`${baseClass}__title`}
            collection={collection}
            data={data}
            fallback={`[${t('untitled')}]`}
            global={global}
            useAsTitle={collection?.admin?.useAsTitle}
          />
          <DocumentTabs
            apiURL={apiURL}
            collection={collection}
            global={global}
            id={id}
            isEditing={isEditing}
          />
        </Fragment>
      )}
    </Gutter>
  )
}
