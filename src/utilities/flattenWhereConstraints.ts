import { WhereField, Where } from '../types';

// Take a where query and flatten it to all top-level operators
const flattenWhereConstraints = (query: Where): WhereField[] => Object.entries(query).reduce((flattenedConstraints, [key, val]) => {
  if ((key === 'and' || key === 'or') && Array.isArray(val)) {
    return [
      ...flattenedConstraints,
      ...val.map((subVal) => flattenWhereConstraints(subVal)),
    ];
  }

  return [
    ...flattenedConstraints,
    val,
  ];
}, []);

export default flattenWhereConstraints;
