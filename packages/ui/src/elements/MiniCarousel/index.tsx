'use client'
import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { appendCacheTag } from '../../utilities/appendCacheTag.js'
import './index.css'

const baseClass = 'mini-carousel'

type MiniCarouselItemProps = {
  active: boolean
  imageCacheTag?: false | string
  label: string
  onClick: () => void
  url: string
}

const MiniCarouselItem: React.FC<MiniCarouselItemProps> = ({
  active,
  imageCacheTag,
  label,
  onClick,
  url,
}) => {
  const src = appendCacheTag(url, imageCacheTag)

  return (
    <button
      aria-label={label}
      aria-pressed={active ? 'true' : 'false'}
      className={[`${baseClass}__item`, active && `${baseClass}__item--active`]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      type="button"
    >
      <img alt={label} src={src} />
    </button>
  )
}

export type MiniCarouselProps = {
  doc: {
    sizes?: FileSizes
    url?: string
  } & Data
  imageCacheTag?: false | string
  onSelect: (sizeKey: null | string) => void
  selectedSize: null | string
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const MiniCarousel: React.FC<MiniCarouselProps> = ({
  doc,
  imageCacheTag,
  onSelect,
  selectedSize,
  uploadConfig,
}) => {
  const { t } = useTranslation()
  const { imageSizes } = uploadConfig
  const { sizes, url: originalUrl } = doc

  const orderedSizeKeys = React.useMemo(() => {
    if (!imageSizes || imageSizes.length === 0) {
      return Object.keys(sizes || {})
    }
    return imageSizes.map(({ name }) => name).filter((name) => sizes?.[name]?.url)
  }, [imageSizes, sizes])

  if (!originalUrl) {
    return null
  }

  return (
    <div className={[baseClass, 'scrollbar-thin'].join(' ')}>
      <MiniCarouselItem
        active={selectedSize === null}
        imageCacheTag={imageCacheTag}
        label={t('general:original')}
        onClick={() => onSelect(null)}
        url={originalUrl}
      />

      {orderedSizeKeys.length > 0 && (
        <>
          <div className={`${baseClass}__divider`} />
          {orderedSizeKeys.map((key) => {
            const sizeData = sizes?.[key]
            if (!sizeData?.url) {
              return null
            }
            return (
              <MiniCarouselItem
                active={selectedSize === key}
                imageCacheTag={imageCacheTag}
                key={key}
                label={key}
                onClick={() => onSelect(key)}
                url={sizeData.url}
              />
            )
          })}
        </>
      )}
    </div>
  )
}
