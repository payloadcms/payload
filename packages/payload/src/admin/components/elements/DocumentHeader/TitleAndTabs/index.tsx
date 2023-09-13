import React from 'react'
import { useTranslation } from 'react-i18next'

import type { DocumentHeaderProps } from '..'

import { Gutter } from '../../Gutter'
import RenderTitle from '../../RenderTitle'
import './index.scss'

export const TitleAndTabs: React.FC<
  DocumentHeaderProps & {
    baseClass: string
  }
> = (props) => {
  const { baseClass: rootBaseClass, collection, customHeader, data } = props
  const { t } = useTranslation('general')

  const {
    admin: { useAsTitle },
  } = collection

  const baseClass = `${rootBaseClass}__title-and-tabs`

  return (
    <Gutter className={baseClass}>
      {customHeader && customHeader}
      {!customHeader && (
        <RenderTitle
          className={`${baseClass}__title`}
          collection={collection}
          data={data}
          fallback={`[${t('untitled')}]`}
          useAsTitle={useAsTitle}
        />
      )}
    </Gutter>
  )
}
