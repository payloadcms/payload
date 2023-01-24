import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Props as ListProps } from '../../views/collections/List/types';

export type Props = {
  collection: SanitizedCollectionConfig,
  columns: ListProps['tableColumns']
  toggleColumn: ListProps['toggleColumn']
  moveColumn: ListProps['moveColumn']
}
