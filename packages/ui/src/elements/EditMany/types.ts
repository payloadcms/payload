import type { SanitizedCollectionConfig } from 'payload/types'
import type { Props as ListProps } from '../../views/List/types'

export type Props = {
  collection: SanitizedCollectionConfig
  resetParams: ListProps['resetParams']
}
