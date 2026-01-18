'use client';

const equalsOperators = [{
  label: 'equals',
  value: 'equals'
}, {
  label: 'isNotEqualTo',
  value: 'not_equals'
}];
export const arrayOperators = [{
  label: 'isIn',
  value: 'in'
}, {
  label: 'isNotIn',
  value: 'not_in'
}];
const exists = {
  label: 'exists',
  value: 'exists'
};
const base = [...equalsOperators, ...arrayOperators, exists];
const numeric = [...base, {
  label: 'isGreaterThan',
  value: 'greater_than'
}, {
  label: 'isLessThan',
  value: 'less_than'
}, {
  label: 'isLessThanOrEqualTo',
  value: 'less_than_equal'
}, {
  label: 'isGreaterThanOrEqualTo',
  value: 'greater_than_equal'
}];
const geo = [...equalsOperators, {
  label: 'near',
  value: 'near'
}];
const within = {
  label: 'within',
  value: 'within'
};
const intersects = {
  label: 'intersects',
  value: 'intersects'
};
const like = {
  label: 'isLike',
  value: 'like'
};
const notLike = {
  label: 'isNotLike',
  value: 'not_like'
};
const contains = {
  label: 'contains',
  value: 'contains'
};
export const fieldTypeConditions = {
  checkbox: {
    component: 'Text',
    operators: [...equalsOperators, exists]
  },
  code: {
    component: 'Text',
    operators: [...base, like, notLike, contains]
  },
  date: {
    component: 'Date',
    operators: [...numeric, exists]
  },
  email: {
    component: 'Text',
    operators: [...base, contains]
  },
  json: {
    component: 'Text',
    operators: [...base, like, contains, notLike, within, intersects]
  },
  number: {
    component: 'Number',
    operators: [...numeric, exists]
  },
  point: {
    component: 'Point',
    operators: [...geo, exists, within, intersects]
  },
  radio: {
    component: 'Select',
    operators: [...base]
  },
  relationship: {
    component: 'Relationship',
    operators: [...base]
  },
  richText: {
    component: 'Text',
    operators: [...base, like, notLike, contains]
  },
  select: {
    component: 'Select',
    operators: [...base]
  },
  text: {
    component: 'Text',
    operators: [...base, like, notLike, contains]
  },
  textarea: {
    component: 'Text',
    operators: [...base, like, notLike, contains]
  },
  upload: {
    component: 'Relationship',
    operators: [...base]
  }
};
export const getValidFieldOperators = ({
  field,
  operator
}) => {
  let validOperators = [];
  if (field.type === 'relationship' && Array.isArray(field.relationTo)) {
    if ('hasMany' in field && field.hasMany) {
      validOperators = [...equalsOperators, exists];
    } else {
      validOperators = [...base];
    }
  } else {
    validOperators = [...fieldTypeConditions[field.type].operators];
  }
  return {
    validOperator: operator && validOperators.find(({
      value
    }) => value === operator) ? operator : validOperators[0].value,
    validOperators
  };
};
//# sourceMappingURL=field-types.js.map