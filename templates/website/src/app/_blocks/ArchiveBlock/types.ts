import type { Page } from '../../../payload-types'

export type ArchiveBlockProps = Extract<Page['layout'][0], { blockType: 'archive' }>
