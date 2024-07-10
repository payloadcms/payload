import type { Page } from '@/payload-types'

export type CarouselBlockProps = Extract<Page['layout'][0], { blockType: 'carousel' }>
