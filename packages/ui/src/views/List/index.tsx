import React from 'react'

import type { Props } from './types'
import { DefaultListClient } from './index.client'

import './index.scss'

const baseClass = 'collection-list'

export const DefaultList: React.FC<Props> = (props) => {
  const {
    collection: {
      slug: collectionSlug,
      admin: { components: { AfterList, AfterListTable, BeforeList, BeforeListTable } = {} } = {},
    },
  } = props

  const propsWithoutCollection = { ...props }
  delete propsWithoutCollection.collection

  return (
    <div className={baseClass}>
      {Array.isArray(BeforeList) &&
        BeforeList.map((Component, i) => <Component key={i} {...props} />)}
      {/* <Meta title={getTranslation(collection.labels.plural, i18n)} /> */}
      <DefaultListClient {...propsWithoutCollection} collectionSlug={collectionSlug} />
      {Array.isArray(AfterList) &&
        AfterList.map((Component, i) => <Component key={i} {...props} />)}
    </div>
  )
}
