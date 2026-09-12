import React from 'react'
import { CallToActionBlockComponent, type CallToActionBlockProps } from './CallToAction/index.js'
import { FeatureGridBlockComponent, type FeatureGridBlockProps } from './FeatureGrid/index.js'
import { HeroBlockComponent, type HeroBlockProps } from './Hero/index.js'

export type LayoutBlock =
  | (HeroBlockProps & { blockType: 'hero'; id?: string | null })
  | (FeatureGridBlockProps & { blockType: 'featureGrid'; id?: string | null })
  | (CallToActionBlockProps & { blockType: 'callToAction'; id?: string | null })
  | { blockType?: string; id?: string | null }
export function RenderBlocks({ blocks }: { blocks?: LayoutBlock[] | null }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  return (
    <div className="layout-blocks">
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.blockType ?? 'unknown'}-${index}`
        switch (block.blockType) {
          case 'hero':
            return <HeroBlockComponent key={key} {...(block as HeroBlockProps)} />
          case 'featureGrid':
            return <FeatureGridBlockComponent key={key} {...(block as FeatureGridBlockProps)} />
          case 'callToAction':
            return <CallToActionBlockComponent key={key} {...(block as CallToActionBlockProps)} />
          default:
            return (
              <div key={key} className="block-unknown" role="note">
                This content block is not available.
              </div>
            )
        }
      })}
    </div>
  )
}
