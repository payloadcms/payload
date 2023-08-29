import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import type { Props as ListProps } from '../../views/collections/List/types.js';

export type Props = {
  collection: SanitizedCollectionConfig,
  resetParams: ListProps['resetParams'],
  title?: string,
}
