import type { Page } from '@/payload-types'

export type ThreeItemGridBlockProps = Extract<Page['layout'][0], { blockType: 'threeItemGrid' }>
