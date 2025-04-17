'use client'

import { getTranslation } from '@payloadcms/translations'

import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { CheckboxPopup } from '../../CheckboxPopup/index.js'
import './index.scss'

const baseClass = 'collection-type'

export function CollectionType() {
  const { filterItems, folderCollectionSlug, visibleCollectionSlugs } = useFolder()
  const { i18n } = useTranslation()
  const { config, getEntityConfig } = useConfig()

  const allFolderCollectionSlugs = [
    folderCollectionSlug,
    ...Object.keys(config.folders.collections),
  ]

  const collectionOptions = allFolderCollectionSlugs.map((collectionSlug) => {
    const collectionConfig = getEntityConfig({ collectionSlug })
    return {
      label: getTranslation(collectionConfig.labels?.plural, i18n),
      value: collectionSlug,
    }
  })

  return (
    <CheckboxPopup
      Button={
        <Button buttonStyle="pill" el="div" icon="chevron" margin={false} size="small">
          {visibleCollectionSlugs.length ? (
            <span className={`${baseClass}__count`}>{visibleCollectionSlugs.length}</span>
          ) : null}
          {/* @todo: translate */}
          Type
        </Button>
      }
      key="relation-to-selection-popup"
      onChange={({ selectedValues }) => {
        filterItems({ relationTo: selectedValues })
      }}
      options={collectionOptions}
      selectedValues={visibleCollectionSlugs}
    />
  )
}
