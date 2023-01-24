import React from 'react';
import type { TFunction } from 'react-i18next';
import Cell from './Cell';
import SortColumn from '../../../elements/SortColumn';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Column } from '../../../elements/Table/types';
import { fieldIsPresentationalOnly } from '../../../../../fields/config/types';
import flattenFields from '../../../../../utilities/flattenTopLevelFields';
import { Props as CellProps } from './Cell/types';

const buildColumns = ({
  collection,
  activeColumns,
  t,
  cellProps,
}: {
  collection: SanitizedCollectionConfig,
  activeColumns: string[],
  t: TFunction,
  cellProps?: Partial<CellProps>[]
}): Column[] => {
  const flattenedFields = flattenFields([
    ...collection.fields,
    {
      name: 'id',
      type: 'text',
      label: 'ID',
    },
    {
      name: 'updatedAt',
      type: 'date',
      label: t('updatedAt'),
    },
    {
      name: 'createdAt',
      type: 'date',
      label: t('createdAt'),
    },
  ]);

  const cols: Column[] = flattenedFields.map((field, colIndex) => {
    const isActive = activeColumns.includes(field.name);

    return {
      active: isActive,
      accessor: field.name,
      name: field.name,
      label: field.label,
      components: {
        Heading: (
          <SortColumn
            label={field.label || field.name}
            name={field.name}
            disable={(('disableSort' in field && Boolean(field.disableSort)) || fieldIsPresentationalOnly(field)) || undefined}
          />
        ),
        renderCell: (rowData, cellData) => {
          return (
            <Cell
              key={JSON.stringify(cellData)}
              field={field}
              colIndex={colIndex}
              collection={collection}
              rowData={rowData}
              cellData={cellData}
              link={colIndex === 0}
              {...cellProps?.[colIndex] || {}}
            />
          );
        },
      },
    };
  });

  return cols;
};

export default buildColumns;
