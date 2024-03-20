import type { Page } from '../../../../test/live-preview/payload-types.js'

export type ArchiveBlockProps = Extract<
  Exclude<Page['layout'], undefined>[0],
  { blockType: 'archive' }
>
