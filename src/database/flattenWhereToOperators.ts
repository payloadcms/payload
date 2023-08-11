import { Where, WhereField } from '../types';

// Take a where query and flatten it to all top-level operators
const flattenWhereToOperators = (query: Where): WhereField[] => Object.entries(query).reduce((flattenedConstraints, [key, val]) => {
  if ((key === 'and' || key === 'or') && Array.isArray(val)) {
    return [
      ...flattenedConstraints,
      ...val.reduce((subVals, subVal) => {
        return [
          ...subVals,
          ...flattenWhereToOperators(subVal),
        ];
      }, []),
    ];
  }

  return [
    ...flattenedConstraints,
    val,
  ];
}, []);

export default flattenWhereToOperators;
