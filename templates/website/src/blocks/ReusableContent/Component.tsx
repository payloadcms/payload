import type { Page } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import React from 'react'

export type Props = Extract<Page['layout'][0], { blockType: 'reusableContentBlock' }>

export const ReusableContentBlock: React.FC<Props> = ({ reusableContentBlockFields }) => {
  const { customId, reusableContent } = reusableContentBlockFields

  if (
    typeof reusableContent === 'object' &&
    reusableContent !== null &&
    'layout' in reusableContent &&
    Array.isArray((reusableContent as { layout: unknown }).layout)
  ) {
    const layout = (reusableContent as { layout: Page['layout'] }).layout

    console.log('Resolved reusable layout:', layout)

    return (
      <section id={customId ?? undefined}>
        <RenderBlocks blocks={layout} />
      </section>
    )
  }

  return null
}
