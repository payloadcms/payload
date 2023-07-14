import { Fields } from './types';

type Result = {
  remainingFields: Fields
  rows: Fields[]
}

export const separateRows = (path: string, fields: Fields): Result => {
  const remainingFields: Fields = {};

  const rows = Object.entries(fields).reduce((incomingRows, [fieldPath, field]) => {
    const newRows = incomingRows;

    if (fieldPath.indexOf(`${path}.`) === 0) {
      const index = Number(fieldPath.replace(`${path}.`, '').split('.')[0]);
      if (!newRows[index]) newRows[index] = {};
      newRows[index][fieldPath.replace(`${path}.${String(index)}.`, '')] = { ...field };
    } else {
      remainingFields[fieldPath] = field;
    }

    return newRows;
  }, []);

  return {
    remainingFields,
    rows,
  };
};

export const flattenRows = (path: string, rows: Fields[]): Fields => {
  return rows.reduce((fields, row, i) => ({
    ...fields,
    ...Object.entries(row).reduce((subFields, [subPath, subField]) => {
      return {
        ...subFields,
        [`${path}.${i}.${subPath}`]: { ...subField },
      };
    }, {}),
  }), {});
};
