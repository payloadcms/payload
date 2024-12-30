import type { Page } from '../../../../payload-types.js'

export type ArchiveBlockProps = Extract<
  Exclude<Page['layout'], undefined>[0],
  { blockType: 'archive' }
>
