import React, { Fragment } from 'react'

import type { Page } from '../../../payload/payload-types.js'
import type { VerticalPaddingOptions } from '../VerticalPadding/index'

import { ArchiveBlock } from '../../_blocks/ArchiveBlock'
import { CallToActionBlock } from '../../_blocks/CallToAction'
import { ContentBlock } from '../../_blocks/Content'
import { MediaBlock } from '../../_blocks/MediaBlock'
import { RelatedProducts, type RelatedProductsProps } from '../../_blocks/RelatedProducts'
import { toKebabCase } from '../../_utilities/toKebabCase'
import { BackgroundColor } from '../BackgroundColor/index'
import { VerticalPadding } from '../VerticalPadding/index'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  mediaBlock: MediaBlock,
  relatedProducts: RelatedProducts,
}

export const Blocks: React.FC<{
  blocks: (Page['layout'][0] | RelatedProductsProps)[]
  disableTopPadding?: boolean
}> = (props) => {
  const { blocks, disableTopPadding } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            // the cta block is containerized, so we don't consider it to be inverted at the block-level
            const blockIsInverted =
              'invertBackground' in block && blockType !== 'cta' ? block.invertBackground : false
            const prevBlock = blocks[index - 1]

            const prevBlockInverted =
              prevBlock && 'invertBackground' in prevBlock && prevBlock?.invertBackground

            const isPrevSame = Boolean(blockIsInverted) === Boolean(prevBlockInverted)

            let paddingTop: VerticalPaddingOptions = 'large'
            let paddingBottom: VerticalPaddingOptions = 'large'

            if (prevBlock && isPrevSame) {
              paddingTop = 'none'
            }

            if (index === blocks.length - 1) {
              paddingBottom = 'large'
            }

            if (disableTopPadding && index === 0) {
              paddingTop = 'none'
            }

            if (Block) {
              return (
                <BackgroundColor invert={blockIsInverted} key={index}>
                  <VerticalPadding bottom={paddingBottom} top={paddingTop}>
                    <Block
                      // @ts-expect-error
                      id={toKebabCase(blockName)}
                      {...block}
                    />
                  </VerticalPadding>
                </BackgroundColor>
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
