import type { TFunction } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Column } from '../../../elements/Table/types';
import { Props as CellProps } from './Cell/types';
declare const buildColumns: ({ collection, columns, t, cellProps, }: {
    collection: SanitizedCollectionConfig;
    columns: string[];
    t: TFunction;
    cellProps?: Partial<CellProps>[];
}) => Column[];
export default buildColumns;
