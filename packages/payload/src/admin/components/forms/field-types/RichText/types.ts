import type { RichTextField } from '../../../../../fields/config/types'

export type Props = Omit<RichTextField, 'type'> & {
  path?: string
}

export type RichTextAdapter = {
  component: React.FC<Props>
}
