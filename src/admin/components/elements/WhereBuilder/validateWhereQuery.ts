import type { Operator, Where } from '../../../../types';
import { validOperators } from '../../../../types/constants';

const validateWhereQuery = (whereQuery): whereQuery is Where => {
  if (whereQuery?.or?.length > 0 && whereQuery?.or?.[0]?.and && whereQuery?.or?.[0]?.and?.length > 0) {
    // At this point we know that the whereQuery has 'or' and 'and' fields,
    // now let's check the structure and content of these fields.

    const isValid = whereQuery.or.every((orQuery) => {
      if (orQuery.and && Array.isArray(orQuery.and)) {
        return orQuery.and.every((andQuery) => {
          if (typeof andQuery !== 'object') {
            return false;
          }
          const andKeys = Object.keys(andQuery);
          // If there are no keys, it's not a valid WhereField.
          if (andKeys.length === 0) {
            return false;
          }
          // eslint-disable-next-line no-restricted-syntax
          for (const key of andKeys) {
            const operator = Object.keys(andQuery[key])[0];
            // Check if the key is a valid Operator.
            if (!operator || !validOperators.includes(operator as Operator)) {
              return false;
            }
          }
          return true;
        });
      }
      return false;
    });

    return isValid;
  }

  return false;
};

export default validateWhereQuery;
