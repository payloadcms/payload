import type { SanitizedCollectionConfig } from 'payload/types'
import type { DefaultListViewProps } from '../../views/List/types'

export type Props = {
  collection: SanitizedCollectionConfig
  resetParams: DefaultListViewProps['resetParams']
  title?: string
}
3
