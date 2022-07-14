import React from 'react';
import Cell from './Cell';
import SortColumn from '../../../elements/SortColumn';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Column } from '../../../elements/Table/types';
import { fieldHasSubFields, Field, fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types';

const buildColumns = (collection: SanitizedCollectionConfig, columns: string[]): Column[] => (columns || []).reduce((cols, col, colIndex) => {
  let field = null;

  const fields = [
    ...collection.fields,
    {
      name: 'id',
      type: 'text',
      label: 'ID',
    } as Field,
    {
      name: 'updatedAt',
      type: 'date',
      label: 'Updated At',
    } as Field,
    {
      name: 'createdAt',
      type: 'date',
      label: 'Created At',
    } as Field,
  ];

  fields.forEach((fieldToCheck) => {
    if ((fieldAffectsData(fieldToCheck) || fieldIsPresentationalOnly(fieldToCheck)) && fieldToCheck.name === col) {
      field = fieldToCheck;
    }

    if (!fieldAffectsData(fieldToCheck) && fieldHasSubFields(fieldToCheck)) {
      fieldToCheck.fields.forEach((subField) => {
        if (fieldAffectsData(subField) && subField.name === col) {
          field = subField;
        }
      });
    }

    return false;
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
          renderCell: (rowData, cellData) => (
            <Cell
              key={JSON.stringify(cellData)}
              field={field}
              colIndex={colIndex}
              collection={collection}
              rowData={rowData}
              cellData={cellData}
            />
          ),
        },
      },
    ];
  }

  return cols;
}, []);

export default buildColumns;
