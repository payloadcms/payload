import type { Page } from '../../../payload/payload-types'

export type ArchiveBlockProps = Extract<Page['layout'][0], { blockType: 'archive' }>
