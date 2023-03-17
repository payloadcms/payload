import { SanitizedCollectionConfig } from '../../../../../../../../collections/config/types';
import { Props as CellProps } from '../../types';

export type Props = CellProps & {
  collection: SanitizedCollectionConfig
}
