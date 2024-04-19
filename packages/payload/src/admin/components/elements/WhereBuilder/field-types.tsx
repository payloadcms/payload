const boolean = [
  {
    label: 'equals',
    value: 'equals',
  },
  {
    label: 'isNotEqualTo',
    value: 'not_equals',
  },
]

const base = [
  ...boolean,
  {
    label: 'isIn',
    value: 'in',
  },
  {
    label: 'isNotIn',
    value: 'not_in',
  },
  {
    label: 'exists',
    value: 'exists',
  },
]

const numeric = [
  ...base,
  {
    label: 'isGreaterThan',
    value: 'greater_than',
  },
  {
    label: 'isLessThan',
    value: 'less_than',
  },
  {
    label: 'isLessThanOrEqualTo',
    value: 'less_than_equal',
  },
  {
    label: 'isGreaterThanOrEqualTo',
    value: 'greater_than_equal',
  },
]

const geo = [
  ...boolean,
  {
    label: 'exists',
    value: 'exists',
  },
  {
    label: 'near',
    value: 'near',
  },
]

const within = {
  label: 'within',
  value: 'within',
}

const intersects = {
  label: 'intersects',
  value: 'intersects',
}

const like = {
  label: 'isLike',
  value: 'like',
}

const contains = {
  label: 'contains',
  value: 'contains',
}

const filterOperators = (operators, hasMany = false) => {
  if (hasMany) {
    return operators.filter(
      (operator) => operator.value !== 'equals' && operator.value !== 'not_equals',
    )
  }
  return operators
}

const fieldTypeConditions = {
  checkbox: {
    component: 'Text',
    operators: boolean,
  },
  code: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  date: {
    component: 'Date',
    operators: [...base, ...numeric],
  },
  email: {
    component: 'Text',
    operators: [...base, contains],
  },
  json: {
    component: 'Text',
    operators: [...base, like, contains, within, intersects],
  },
  number: {
    component: 'Number',
    operators: (hasMany) => filterOperators([...base, ...numeric], hasMany),
  },
  point: {
    component: 'Point',
    operators: [...geo, within, intersects],
  },
  radio: {
    component: 'Select',
    operators: [...base],
  },
  relationship: {
    component: 'Relationship',
    operators: [...base],
  },
  richText: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  select: {
    component: 'Select',
    operators: (hasMany) => filterOperators([...base], hasMany),
  },
  text: {
    component: 'Text',
    operators: (hasMany) => filterOperators([...base, like, contains], hasMany),
  },
  textarea: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  upload: {
    component: 'Text',
    operators: [...base],
  },
}

export default fieldTypeConditions
