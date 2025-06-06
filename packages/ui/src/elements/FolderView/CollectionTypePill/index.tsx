'use client'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { CheckboxPopup } from '../../CheckboxPopup/index.js'
import './index.scss'

const baseClass = 'collection-type'

export function CollectionTypePill() {
  const { filterItems, folderCollectionSlug, folderCollectionSlugs, visibleCollectionSlugs } =
    useFolder()
  const { i18n, t } = useTranslation()
  const { config, getEntityConfig } = useConfig()

  const [allCollectionOptions] = React.useState(() => {
    return config.collections.reduce(
      (acc, collection) => {
        if (collection.folders && folderCollectionSlugs.includes(collection.slug)) {
          acc.push({
            label: getTranslation(collection.labels?.plural, i18n),
            value: collection.slug,
          })
        }

        return acc
      },
      [
        {
          label: getTranslation(
            getEntityConfig({ collectionSlug: folderCollectionSlug }).labels?.plural,
            i18n,
          ),
          value: folderCollectionSlug,
        },
      ],
    )
  })

  return (
    <CheckboxPopup
      Button={
        <Button buttonStyle="pill" el="div" icon="chevron" margin={false} size="small">
          {visibleCollectionSlugs.length ? (
            <span className={`${baseClass}__count`}>{visibleCollectionSlugs.length}</span>
          ) : null}
          {t('version:type')}
        </Button>
      }
      key="relation-to-selection-popup"
      onChange={({ selectedValues }) => {
        void filterItems({ relationTo: selectedValues })
      }}
      options={allCollectionOptions}
      selectedValues={visibleCollectionSlugs}
    />
  )
}
