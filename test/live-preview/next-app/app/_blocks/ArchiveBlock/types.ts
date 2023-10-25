import type { Page } from '../../../payload-types'

export type ArchiveBlockProps = Extract<
  Exclude<Page['layout'], undefined>[0],
  { blockType: 'archive' }
>
