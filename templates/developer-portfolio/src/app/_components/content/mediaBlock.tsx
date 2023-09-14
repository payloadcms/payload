import { FC, Fragment } from 'react'
import { cva } from 'class-variance-authority'
import Image from 'next/image'

import { Media } from '../../../payload-types'
import { cn } from '../../../utilities'
import { Block, BlockProps } from '../ui/block'
import { MediaDialog } from './mediaDialog'

const mediaBlockCaptionVariants = cva('flex w-full mt-1 text-primary', {
  variants: {
    captionSize: {
      small: 'text-sm md:text-base lg:text-xl',
      large: 'text-xl lg:leading-7',
    },
  },
  defaultVariants: {
    captionSize: 'small',
  },
})

interface MediaBlockFields extends BlockProps {
  media: string | Media
  mediaFit?: 'contain' | 'cover'
}

interface MediaBlockProps {
  mediaFields: MediaBlockFields[]
  lightbox?: boolean
  className?: string
  containerClassName?: string
  imageClassName?: string
  captionClassName?: string
  priority?: boolean
  captionSize?: 'small' | 'large'
}

const sizesMap = {
  full: '1080px',
  half: '540px',
  oneThird: '360px',
  twoThirds: '720px',
}

export const MediaBlock: FC<MediaBlockProps> = ({
  mediaFields,
  className,
  containerClassName,
  imageClassName,
  captionClassName,
  lightbox = true,
  priority,
  captionSize,
}) => {
  return (
    <Fragment>
      {mediaFields.map(({ media, size, mediaFit = 'cover' }) => {
        const mediaInfo = media as Media

        const base = (
          <Fragment>
            <div
              className={cn(
                'flex-0 flex relative',
                mediaFit === 'cover' ? 'h-full w-auto' : 'h-auto w-full',
              )}
            >
              <Image
                className={cn('overflow-hidden rounded-3xl flex-1', imageClassName)}
                src={mediaInfo.url}
                alt={mediaInfo.alt}
                width={mediaInfo.width}
                height={mediaInfo.height}
                sizes={`(min-width: 1024px) ${sizesMap[size]}, 90vw`}
                style={{
                  objectFit: mediaFit ?? 'cover',
                }}
                priority={priority}
              />
            </div>
          </Fragment>
        )

        const containerClassNames = cn(
          'flex flex-col relative w-full text-left',
          containerClassName,
          mediaFit === 'cover' && 'h-full w-auto',
        )

        const caption = mediaInfo.alt && (
          <p className={mediaBlockCaptionVariants({ captionSize, className: captionClassName })}>
            {mediaInfo.alt}
          </p>
        )

        if (lightbox) {
          return (
            <Block size={size} className={cn('flex-col', className)} key={mediaInfo.id}>
              <MediaDialog
                className={containerClassNames}
                mediaFit={mediaFit}
                triggerContent={base}
                caption={caption}
                mediaInfo={mediaInfo}
              />
            </Block>
          )
        }

        return (
          <Block size={size} className={cn('flex-col', className)} key={mediaInfo.id}>
            {base}
            {caption}
          </Block>
        )
      })}
    </Fragment>
  )
}
