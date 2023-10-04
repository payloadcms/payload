import React, { useEffect, useState } from 'react'

import type { SanitizedCollectionConfig } from '../../../../exports/types'
import type { FileSizes, Upload } from '../../../../uploads/types'
import type { Data } from '../../forms/Form/types'

import Meta from '../FileDetails/Meta'
import './index.scss'

const baseClass = 'preview-sizes'

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

const PreviewSizes: React.FC<{
  collection: SanitizedCollectionConfig
  doc?: Data & {
    sizes?: FileSizes
  }
}> = ({ collection, doc }) => {
  const {
    upload: { imageSizes, staticURL },
  } = collection
  const { sizes } = doc

  const [orderedSizes, setOrderedSizes] = useState<FileSizes>(() => sortSizes(sizes, imageSizes))
  const [selectedSize, setSelectedSize] = useState<null | string>(
    orderedSizes?.[imageSizes[0]?.name]?.filename ? imageSizes[0]?.name : null,
  )

  useEffect(() => {
    setOrderedSizes(sortSizes(sizes, imageSizes))
  }, [sizes, imageSizes])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__imageWrap`}>
        <div className={`${baseClass}__meta`}>
          <div className={`${baseClass}__sizeName`}>{selectedSize}</div>
          <Meta {...(selectedSize && orderedSizes[selectedSize])} staticURL={staticURL} />
        </div>
        <img
          alt={doc.filename}
          className={`${baseClass}__preview`}
          src={`${staticURL}/${orderedSizes[selectedSize]?.filename}`}
        />
      </div>
      <div className={`${baseClass}__listWrap`}>
        <ul className={`${baseClass}__list`}>
          {Object.entries(orderedSizes).map(([key, val]) => {
            const selected = selectedSize === key
            if (val?.filename) {
              return (
                <li
                  className={[`${baseClass}__sizeOption`, selected && `${baseClass}--selected`]
                    .filter(Boolean)
                    .join(' ')}
                  key={key}
                  onClick={() => setSelectedSize(key)}
                  role="presentation"
                >
                  <div className={`${baseClass}__image`}>
                    <img alt={val.filename} src={`${staticURL}/${val.filename}`} />
                  </div>
                  <div className={`${baseClass}__sizeMeta`}>
                    <div className={`${baseClass}__sizeName`}>{key}</div>
                    <Meta {...val} staticURL={staticURL} />
                  </div>
                </li>
              )
            }

            return null
          })}
        </ul>
      </div>
    </div>
  )
}
export default PreviewSizes
