import type { Where } from '../../../../types';

/**
 * Something like [or][0][and][0][text][equals]=example%20post will work and pass through the validateWhereQuery check.
 * However, something like [text][equals]=example%20post will not work and will fail the validateWhereQuery check,
 * even though it is a valid Where query. This needs to be transformed here.
 */
export const transformWhereQuery = (whereQuery): Where => {
  if (!whereQuery) {
    return {};
  }
  // Check if 'whereQuery' has 'or' field but no 'and'. This is the case for "correct" queries
  if (whereQuery.or && !whereQuery.and) {
    return {
      or: whereQuery.or.map((query) => {
        // ...but if the or query does not have an and, we need to add it
        if(!query.and) {
          return {
            and: [query]
          }
        }
        return query;
      }),
    };
  }

  // Check if 'whereQuery' has 'and' field but no 'or'.
  if (whereQuery.and && !whereQuery.or) {
    return {
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
          and: [whereQuery], // top-level siblings are considered 'and'
        },
      ],
    };
  }

  // If 'whereQuery' has 'or' and 'and', just return it as it is.
  return whereQuery;
};
