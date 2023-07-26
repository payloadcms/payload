import { Where } from '../../../../types';

/**
 * Something like [or][0][and][0][text][equals]=example%20post will work and pass through the validateWhereQuery check.
 * However, something like [text][equals]=example%20post will not work and will fail the validateWhereQuery check,
 * even though it is a valid Where query. This needs to be transformed here.
 */
export const transformWhereQuery = (whereQuery): Where => {
  if (!whereQuery) {
    return {};
  }
  // Check if 'whereQuery' has 'or' field but no 'and'.
  if (whereQuery.or && !whereQuery.and) {
    return {
      ...whereQuery,
      or: whereQuery.or.map((query) => ({
        and: [query],
      })),
    };
  }

  // Check if 'whereQuery' has 'and' field but no 'or'.
  if (whereQuery.and && !whereQuery.or) {
    return {
      ...whereQuery,
      or: [
        {
          and: whereQuery.and,
        },
      ],
    };
  }

  // Check if 'whereQuery' has neither 'or' nor 'and'.
  if (!whereQuery.or && !whereQuery.and) {
    return {
      or: [
        {
          and: [whereQuery],
        },
      ],
    };
  }

  // If 'whereQuery' already has 'or' and 'and', just return it as it is.
  return whereQuery;
};
