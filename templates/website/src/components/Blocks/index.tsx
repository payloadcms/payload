'use client'

import React, { Fragment } from 'react'

import { ArchiveBlock } from '../../app/_blocks/ArchiveBlock'
import { CallToActionBlock } from '../../app/_blocks/CallToAction'
import { ContentBlock } from '../../app/_blocks/Content'
import { FormBlock } from '../../app/_blocks/FormBlock'
import { MediaBlock } from '../../app/_blocks/MediaBlock'
import { Page } from '../../payload-types'
import { toKebabCase } from '../../utilities/toKebabCase'
import { BackgroundColor } from '../BackgroundColor'
import { VerticalPadding, VerticalPaddingOptions } from '../VerticalPadding'

const blockComponents = {
  cta: CallToActionBlock,
  content: ContentBlock,
  mediaBlock: MediaBlock,
  archive: ArchiveBlock,
  formBlock: FormBlock,
}

export const Blocks: React.FC<{
  blocks: Page['layout']
  disableTopPadding?: boolean
}> = props => {
  const { disableTopPadding, blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]
            const backgroundColor = 'backgroundColor' in block ? block.backgroundColor : 'white'
            const prevBlock = blocks[index - 1]
            const nextBlock = blocks[index + 1]

            const prevBlockBackground =
              prevBlock?.[`${prevBlock.blockType}`]?.backgroundColor || 'white'
            const nextBlockBackground =
              nextBlock?.[`${nextBlock.blockType}`]?.backgroundColor || 'white'

            let paddingTop: VerticalPaddingOptions = 'large'
            let paddingBottom: VerticalPaddingOptions = 'large'

            if (backgroundColor && backgroundColor === prevBlockBackground) {
              paddingTop = 'medium'
            }

            if (backgroundColor && backgroundColor === nextBlockBackground) {
              paddingBottom = 'medium'
            }

            if (index === blocks.length - 1) {
              paddingBottom = 'large'
            }

            if (disableTopPadding && index === 0) {
              paddingTop = 'none'
            }

            if (!disableTopPadding && index === 0) {
              paddingTop = 'large'
            }

            if (Block) {
              return (
                <BackgroundColor key={index} color={backgroundColor}>
                  <VerticalPadding top={paddingTop} bottom={paddingBottom}>
                    {/* @ts-ignore */}
                    <Block
                      // @ts-ignore
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
