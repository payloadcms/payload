import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { SlideRenderer } from '@/components/SlideRenderer'
import { RenderHero } from '@/heros/RenderHero'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  hero?: Page['hero']
  slideMode?: boolean
}> = (props) => {
  const { blocks, hero, slideMode } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (!hasBlocks && !hero) {
    return null
  }

  // Render in slide mode if enabled
  if (slideMode) {
    const slides = blocks
      .map((block, index) => {
        const { blockType } = block

        if (blockType && blockType in blockComponents) {
          const Block = blockComponents[blockType]

          if (Block) {
            return (
              // @ts-expect-error there may be some mismatch between the expected types here
              <Block key={index} {...block} disableInnerContainer />
            )
          }
        }
        return null
      })
      .filter((slide) => slide !== null) as React.ReactNode[]

    // Prepend Hero as the first slide if it exists
    if (hero && hero.type !== 'none') {
      slides.unshift(
        <div
          key="hero"
          className="relative w-full h-full flex items-center justify-center [&_*]:mt-0"
        >
          <div className="w-full">
            <RenderHero {...hero} />
          </div>
        </div>,
      )
    }

    return <SlideRenderer slides={slides} />
  }

  // Normal rendering mode
  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block

        if (blockType && blockType in blockComponents) {
          const Block = blockComponents[blockType]

          if (Block) {
            return (
              <div className="my-16" key={index}>
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <Block {...block} disableInnerContainer />
              </div>
            )
          }
        }
        return null
      })}
    </Fragment>
  )
}
