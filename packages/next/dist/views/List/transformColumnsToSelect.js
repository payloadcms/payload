import { unflatten } from 'payload/shared';
export const transformColumnsToSelect = columns => {
  const columnsSelect = columns.reduce((acc, column) => {
    if (column.active) {
      acc[column.accessor] = true;
    }
    return acc;
  }, {});
  return unflatten(columnsSelect);
};
//# sourceMappingURL=transformColumnsToSelect.js.map