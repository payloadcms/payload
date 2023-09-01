import React, { useEffect, useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { useTranslation } from 'react-i18next'

import type { FileSizes, Upload } from '../../../../uploads/types'
import type { Props } from './types'

import Chevron from '../../icons/Chevron'
import Button from '../Button'
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

  const [moreInfoOpen, setMoreInfoOpen] = useState(false)
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
            <Button
              buttonStyle="none"
              className={`${baseClass}__toggle-more-info${moreInfoOpen ? ' open' : ''}`}
              onClick={() => setMoreInfoOpen(!moreInfoOpen)}
            >
              {!moreInfoOpen && (
                <React.Fragment>
                  {t('moreInfo')}
                  <Chevron />
                </React.Fragment>
              )}
              {moreInfoOpen && (
                <React.Fragment>
                  {t('lessInfo')}
                  <Chevron />
                </React.Fragment>
              )}
            </Button>
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
      {hasSizes && (
        <AnimateHeight className={`${baseClass}__more-info`} height={moreInfoOpen ? 'auto' : 0}>
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
    </div>
  )
}

export default FileDetails
