import { FC, Fragment } from 'react'

import { Media } from '../../../payload/payload-types'
import { ContentBlock } from './contentBlock'
import { PayloadLink, PayloadLinkType } from './link'
import { MediaBlock } from './mediaBlock'

type LayoutSize = 'oneThird' | 'twoThirds' | 'half' | 'full'

interface MediaContentFields {
  alignment?: 'contentMedia' | 'mediaContent'
  mediaSize?: LayoutSize
  media: Media | string
  mediaFit?: 'contain' | 'cover'
  richText?: unknown
  enableLink?: boolean
  link?: PayloadLinkType
}

export interface MediaContentBlockProps {
  mediaContentFields?: MediaContentFields[]
  priority?: boolean
}

const complimentSizes: Record<LayoutSize, LayoutSize> = {
  oneThird: 'twoThirds',
  twoThirds: 'oneThird',
  half: 'half',
  full: 'full',
}

export const MediaContentBlock: FC<MediaContentBlockProps> = ({ mediaContentFields, priority }) => {
  return (
    <Fragment>
      {mediaContentFields?.map(
        ({ alignment, mediaSize, media, richText, link, enableLink, mediaFit }) => {
          const mediaBlock = (
            <MediaBlock
              priority={priority}
              className="mb-10 md:mb-16 lg:mb-0"
              mediaFields={[
                {
                  size: mediaSize,
                  media,
                  mediaFit,
                },
              ]}
            />
          )

          const contentBlock = (
            <ContentBlock
              contentFields={[
                {
                  size: complimentSizes[mediaSize],
                  richText,
                },
              ]}
            />
          )

          let content
          if (alignment === 'contentMedia') {
            content = (
              <Fragment>
                {contentBlock}
                {mediaBlock}
              </Fragment>
            )
          } else {
            content = (
              <Fragment>
                {mediaBlock}
                {contentBlock}
              </Fragment>
            )
          }

          if (enableLink) {
            content = (
              <PayloadLink
                link={link}
                className="col-span-6 grid grid-cols-6 mt-8 lg:mt-0 lg:gap-20"
              >
                {content}
              </PayloadLink>
            )
          }

          return content
        },
      )}
    </Fragment>
  )
}
