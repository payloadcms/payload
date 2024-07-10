import { ArchiveBlock } from '@/blocks/ArchiveBlock'
import { CallToActionBlock } from '@/blocks/CallToAction'
import { CarouselBlock } from '@/blocks/Carousel'
import { ContentBlock } from '@/blocks/Content'
import { FormBlock } from '@/blocks/Form'
import { MediaBlock } from '@/blocks/MediaBlock'
import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid'
import { toKebabCase } from '@/utilities/toKebabCase'
import React, { Fragment } from 'react'

import type { Page } from '../../../payload-types'

const blockComponents = {
  archive: ArchiveBlock,
  carousel: CarouselBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  threeItemGrid: ThreeItemGridBlock,
}

export const Blocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  <Block id={toKebabCase(blockName)} {...block} />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
