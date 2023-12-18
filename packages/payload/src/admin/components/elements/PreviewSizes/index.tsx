import React, { useEffect, useMemo, useState } from 'react'

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

type PreviewSizeCardProps = {
  active: boolean
  baseURL: string
  meta: FileSizes[0]
  name: string
  onClick?: () => void
  previewSrc: string
}
const PreviewSizeCard: React.FC<PreviewSizeCardProps> = ({
  name,
  active,
  baseURL,
  meta,
  onClick,
  previewSrc,
}) => {
  return (
    <div
      className={[`${baseClass}__sizeOption`, active && `${baseClass}--selected`]
        .filter(Boolean)
        .join(' ')}
      onClick={typeof onClick === 'function' ? onClick : undefined}
      onKeyDown={(e) => {
        if (typeof onClick !== 'function') return
        if (e.key === 'Enter') onClick()
      }}
      role="button"
      tabIndex={0}
    >
      <div className={`${baseClass}__image`}>
        <img alt={meta.filename} src={previewSrc} />
      </div>
      <div className={`${baseClass}__sizeMeta`}>
        <div className={`${baseClass}__sizeName`}>{name}</div>
        <Meta {...meta} staticURL={baseURL} />
      </div>
    </div>
  )
}

const PreviewSizes: React.FC<{
  collection: SanitizedCollectionConfig
  doc: Data & {
    sizes?: FileSizes
  }
  imageCacheTag?: string
}> = ({ collection, doc, imageCacheTag }) => {
  const {
    upload: { imageSizes, staticURL },
  } = collection
  const { sizes } = doc

  const [orderedSizes, setOrderedSizes] = useState<FileSizes>(() => sortSizes(sizes, imageSizes))
  const [selectedSize, setSelectedSize] = useState<null | string>(null)

  const generateImageUrl = (doc) => {
    if (!doc.filename) return null
    if (doc.url) return `${doc.url}${imageCacheTag ? `?${imageCacheTag}` : ''}`
  }
  useEffect(() => {
    setOrderedSizes(sortSizes(sizes, imageSizes))
  }, [sizes, imageSizes, imageCacheTag])

  const mainPreviewSrc = selectedSize
    ? generateImageUrl(doc.sizes[selectedSize])
    : generateImageUrl(doc)

  const originalImage = useMemo(
    (): FileSizes[0] => ({
      filename: doc.filename,
      filesize: doc.filesize,
      height: doc.height,
      mimeType: doc.mimeType,
      width: doc.width,
    }),
    [doc],
  )
  const originalFilename = 'Original'

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__imageWrap`}>
        <div className={`${baseClass}__meta`}>
          <div className={`${baseClass}__sizeName`}>{selectedSize || originalFilename}</div>
          <Meta
            {...(selectedSize ? orderedSizes[selectedSize] : originalImage)}
            staticURL={staticURL}
          />
        </div>
        <img alt={doc.filename} className={`${baseClass}__preview`} src={mainPreviewSrc} />
      </div>
      <div className={`${baseClass}__listWrap`}>
        <div className={`${baseClass}__list`}>
          <PreviewSizeCard
            active={!selectedSize}
            baseURL={staticURL}
            meta={originalImage}
            name={originalFilename}
            onClick={() => setSelectedSize(null)}
            previewSrc={generateImageUrl(doc)}
          />

          {Object.entries(orderedSizes).map(([key, val]) => {
            const selected = selectedSize === key
            const previewSrc = generateImageUrl(val)

            if (previewSrc) {
              return (
                <PreviewSizeCard
                  active={selected}
                  baseURL={staticURL}
                  key={key}
                  meta={val}
                  name={key}
                  onClick={() => setSelectedSize(key)}
                  previewSrc={previewSrc}
                />
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
export default PreviewSizes
