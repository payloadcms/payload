import React, { useEffect, useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { useTranslation } from 'react-i18next'

import type { FileSizes, Upload } from '../../../../uploads/types'
import type { Props } from './types'

import Button from '../Button'
import { Drawer, DrawerToggler } from '../Drawer'
import EditUpload from '../EditUpload'
import Thumbnail from '../Thumbnail'
import Meta from './Meta'
import './index.scss'

const baseClass = 'file-details'

// sort to the same as imageSizes
const sortSizes = (sizes: FileSizes, imageSizes: Upload['imageSizes']) => {
  if (!imageSizes || imageSizes.length === 0) return sizes

  const orderedSizes: FileSizes = {}

  imageSizes.forEach(({ name }) => {
    if (sizes[name]) {
      orderedSizes[name] = sizes[name]
    }
  })

  return orderedSizes
}

const FileDetails: React.FC<Props> = (props) => {
  const { collection, doc, handleRemove } = props

  const {
    slug: collectionSlug,
    upload: { imageSizes, staticURL },
  } = collection

  const { filename, filesize, height, id, mimeType, sizes, url, width } = doc

  const [orderedSizes, setOrderedSizes] = useState<FileSizes>(() => sortSizes(sizes, imageSizes))

  useEffect(() => {
    setOrderedSizes(sortSizes(sizes, imageSizes))
  }, [sizes, imageSizes])

  const { t } = useTranslation('upload')

  const hasSizes = sizes && Object.keys(sizes)?.length > 0

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail collection={collection} doc={doc} />
        <div className={`${baseClass}__main-detail`}>
          <Meta
            collection={collectionSlug}
            filename={filename as string}
            filesize={filesize as number}
            height={height as number}
            id={id as string}
            mimeType={mimeType as string}
            staticURL={staticURL}
            url={url as string}
            width={width as number}
          />

          {hasSizes && (
            <div className={`${baseClass}__file-mutation`}>
              <DrawerToggler className={`${baseClass}__edit`} slug="preview-sizes">
                Preview Sizes
              </DrawerToggler>
              <DrawerToggler className={`${baseClass}__edit`} slug="edit-upload">
                Edit Image
              </DrawerToggler>
            </div>
          )}
        </div>
        {handleRemove && (
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__remove`}
            icon="x"
            iconStyle="with-border"
            onClick={handleRemove}
            round
          />
        )}
      </header>
      <Drawer slug="preview-sizes" title={`Sizes for ${filename}`}>
        {hasSizes && (
          <AnimateHeight className={`${baseClass}__more-info`}>
            <ul className={`${baseClass}__sizes`}>
              {Object.entries(orderedSizes).map(([key, val]) => {
                if (val?.filename) {
                  return (
                    <li key={key}>
                      <div className={`${baseClass}__size-label`}>{key}</div>
                      <Meta {...val} mimeType={val.mimeType} staticURL={staticURL} />
                    </li>
                  )
                }

                return null
              })}
            </ul>
          </AnimateHeight>
        )}
      </Drawer>

      <Drawer slug="edit-upload" title={`Editing ${filename}`}>
        <EditUpload fileSrc={doc.url} />
      </Drawer>
    </div>
  )
}

export default FileDetails
