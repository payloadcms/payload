import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../exports/types'

import { Gutter } from '../../Gutter'
import RenderTitle from '../../RenderTitle'
import { DocumentTabs } from './Tabs'
import './index.scss'

export const TitleAndTabs: React.FC<{
  apiURL: string
  collection: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data?: any
  id: string
}> = (props) => {
  const { apiURL, collection, customHeader, data, id } = props
  const { t } = useTranslation('general')

  const {
    admin: { useAsTitle },
  } = collection

  const baseClass = `title-and-tabs`

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
            useAsTitle={useAsTitle}
          />
          <DocumentTabs apiURL={apiURL} collection={collection} id={id} />
        </Fragment>
      )}
    </Gutter>
  )
}
