import type { RichTextField } from '../../../../../fields/config/types'

export type Props = Omit<RichTextField, 'type'> & {
  path?: string
}

export interface RichTextAdapter {
  component: React.FC<Props>
}
