export const buildSortParam = (sort: string, timestamps: boolean) => {
  let sortParam: Record<string, string>;

  if (!sort) {
    if (timestamps) {
      sortParam = { createdAt: 'desc' };
    } else {
      sortParam = { _id: 'desc' };
    }
  } else if (sort.indexOf('-') === 0) {
    sortParam = {
      [sort.substring(1)]: 'desc',
    };
  } else {
    sortParam = {
      [sort]: 'asc',
    };
  }

  return sortParam;
};
