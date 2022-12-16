const boolean = [
  {
    label: 'equals',
    value: 'equals',
  },
  {
    label: 'is not equal to',
    value: 'not_equals',
  },
];

const base = [
  ...boolean,
  {
    label: 'is in',
    value: 'in',
  },
  {
    label: 'is not in',
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
    label: 'is greater than',
    value: 'greater_than',
  },
  {
    label: 'is less than',
    value: 'less_than',
  },
  {
    label: 'is less than or equal to',
    value: 'less_than_equal',
  },
  {
    label: 'is greater than or equal to',
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
  label: 'is like',
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
