import React from 'react';
import Cell from '../../views/collections/List/Cell';
import SortColumn from '../SortColumn';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import { fieldIsPresentationalOnly } from '../../../../fields/config/types';
import flattenFields from '../../../../utilities/flattenTopLevelFields';
import { Props as CellProps } from '../../views/collections/List/Cell/types';
import SelectAll from '../../views/collections/List/SelectAll';
import SelectRow from '../../views/collections/List/SelectRow';

const buildColumns = ({
  collection,
  columns,
  cellProps,
}: {
  collection: SanitizedCollectionConfig,
  columns: Pick<Column, 'accessor' | 'active'>[],
  cellProps: Partial<CellProps>[]
}): Column[] => {
  // sort the fields to the order of activeColumns
  const sortedFields = flattenFields(collection.fields, true).sort((a, b) => {
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
            disable={
              ('disableSort' in field && Boolean(field.disableSort))
              || fieldIsPresentationalOnly(field)
              || undefined
            }
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
              {...(cellProps?.[colIndex] || {})}
            />
          );
        },
      },
    };
  });

  cols.unshift({
    active: true,
    label: null,
    name: '',
    accessor: '_select',
    components: {
      Heading: (
        <SelectAll />
      ),
      renderCell: (rowData) => (
        <SelectRow
          id={rowData.id}
        />
      ),
    },
  });

  return cols;
};

export default buildColumns;
