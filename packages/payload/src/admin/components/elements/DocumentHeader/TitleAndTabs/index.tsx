import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { DocumentHeaderProps } from '..'

import { Gutter } from '../../Gutter'
import RenderTitle from '../../RenderTitle'
import { DocumentTabs } from './Tabs'
import './index.scss'

export const TitleAndTabs: React.FC<
  DocumentHeaderProps & {
    baseClass: string
  }
> = (props) => {
  const { apiURL, baseClass: rootBaseClass, collection, customHeader, data, id } = props
  const { t } = useTranslation('general')

  const {
    admin: { useAsTitle },
  } = collection

  const baseClass = `${rootBaseClass}__title-and-tabs`

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
