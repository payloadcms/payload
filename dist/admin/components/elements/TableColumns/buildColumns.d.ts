import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import { Props as CellProps } from '../../views/collections/List/Cell/types';
declare const buildColumns: ({ collection, columns, cellProps, }: {
    collection: SanitizedCollectionConfig;
    columns: Pick<Column, 'accessor' | 'active'>[];
    cellProps: Partial<CellProps>[];
}) => Column[];
export default buildColumns;
