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
  columns,
  t,
  cellProps,
}: {
  collection: SanitizedCollectionConfig,
  columns: string[],
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
  ], true);

  return (columns || []).reduce((cols, col, colIndex) => {
    let field = null;

    flattenedFields.forEach((fieldToCheck) => {
      if (fieldToCheck.name === col) {
        field = fieldToCheck;
      }
    });

    if (field) {
      return [
        ...cols,
        {
          accessor: field.name,
          components: {
            Heading: (
              <SortColumn
                label={field.label || field.name}
                name={field.name}
                disable={(field.disableSort || fieldIsPresentationalOnly(field)) || undefined}
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
        },
      ];
    }

    return cols;
  }, []);
};

export default buildColumns;
