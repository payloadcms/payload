import React from 'react';
import Cell from './Cell';
import SortColumn from '../../../elements/SortColumn';

const buildColumns = (collection, columns, setSort) => (columns || []).reduce((cols, col, colIndex) => {
  let field = null;

  collection.fields.forEach((fieldToCheck) => {
    if (fieldToCheck.name === col) {
      field = fieldToCheck;
    }

    if (!fieldToCheck.name && Array.isArray(fieldToCheck.fields)) {
      fieldToCheck.fields.forEach((subField) => {
        if (subField.name === col) {
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
              label={field.label}
              name={field.name}
              handleChange={setSort}
              disable={field.disableSort || undefined}
            />
          ),
          renderCell: (rowData, cellData) => (
            <Cell
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
