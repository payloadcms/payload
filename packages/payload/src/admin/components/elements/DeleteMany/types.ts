import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import type { Props as ListProps } from '../../views/collections/List/types.js';

export type Props = {
  collection: SanitizedCollectionConfig,
  title?: string,
  resetParams: ListProps['resetParams'],
}
