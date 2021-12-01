export const buildSortParam = (sort: string, timestamps: boolean) => {
  let sortProperty: string;
  let sortOrder = 'desc';

  if (!sort) {
    if (timestamps) {
      sortProperty = 'createdAt';
    } else {
      sortProperty = '_id';
    }
  } else if (sort.indexOf('-') === 0) {
    sortProperty = sort.substring(1);
  } else {
    sortProperty = sort;
    sortOrder = 'asc';
  }

  if (sortProperty === 'id') sortProperty = '_id';

  return [sortProperty, sortOrder];
};
