import React from 'react';
import type { TFunction } from 'react-i18next';
import Cell from '../../views/collections/List/Cell';
import SortColumn from '../SortColumn';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import { fieldIsPresentationalOnly } from '../../../../fields/config/types';
import flattenFields from '../../../../utilities/flattenTopLevelFields';
import { Props as CellProps } from '../../views/collections/List/Cell/types';

const buildColumns = ({
  collection,
  columns,
  t,
  cellProps,
}: {
  collection: SanitizedCollectionConfig,
  columns: Pick<Column, 'accessor' | 'active'>[],
  t: TFunction,
  cellProps?: Partial<CellProps>[]
}): Column[] => {
  // combine the configured fields with the base fields then remove duplicates
  const combinedFields = collection.fields.concat([
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
  ]).filter((field, index, self) => self.findIndex((thisField) => 'name' in thisField && 'name' in field && thisField.name === field.name) === index);

  const flattenedFields = flattenFields(combinedFields);

  // sort the fields to the order of activeColumns
  const sortedFields = flattenedFields.sort((a, b) => {
    const aIndex = columns.findIndex((column) => column.accessor === a.name);
    const bIndex = columns.findIndex((column) => column.accessor === b.name);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const firstActiveColumn = sortedFields.find((field) => columns.find((column) => column.accessor === field.name)?.active);

  const cols: Column[] = sortedFields.map((field, colIndex) => {
    const isActive = columns.find((column) => column.accessor === field.name)?.active || false;
    const isFirstActive = firstActiveColumn?.name === field.name;

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
              link={isFirstActive}
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
