import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import type { Props as ListProps } from '../../views/collections/List/types';

export type Props = {
  collection: SanitizedCollectionConfig,
  resetParams: ListProps['resetParams'],
}
