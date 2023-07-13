const boolean = [
  {
    label: 'equals',
    value: 'equals',
  },
  {
    label: 'isNotEqualTo',
    value: 'not_equals',
  },
];

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
];

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
    value: 'greater_than_equals',
  },
];

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
];

const like = {
  label: 'isLike',
  value: 'like',
};

const contains = {
  label: 'contains',
  value: 'contains',
};

const fieldTypeConditions = {
  text: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  email: {
    component: 'Text',
    operators: [...base, contains],
  },
  textarea: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  code: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  json: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  richText: {
    component: 'Text',
    operators: [...base, like, contains],
  },
  number: {
    component: 'Number',
    operators: [...base, ...numeric],
  },
  date: {
    component: 'Date',
    operators: [...base, ...numeric],
  },
  point: {
    component: 'Point',
    operators: [...geo],
  },
  upload: {
    component: 'Text',
    operators: [...base],
  },
  relationship: {
    component: 'Relationship',
    operators: [...base],
  },
  select: {
    component: 'Text',
    operators: [...base],
  },
  checkbox: {
    component: 'Text',
    operators: boolean,
  },
};

export default fieldTypeConditions;
