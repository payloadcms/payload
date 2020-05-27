const boolean = [
  {
    label: 'equals',
    value: 'equals',
  },
  {
    label: 'is not equal to',
    value: 'not-equals',
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
    value: 'not-in',
  },
];

const numeric = [
  ...base,
  {
    label: 'is greater Than',
    value: 'greater_than',
  },
  {
    label: 'is less than',
    value: 'less_than',
  },
  {
    label: 'is less than or equal to',
    value: 'less_than_equals',
  },
  {
    label: 'is greater than or equal to',
    value: 'greater_than_equals',
  },
];

const like = {
  label: 'is like',
  value: 'like',
};

const fieldTypeConditions = {
  text: {
    component: 'text',
    operators: [...base, like],
  },
  email: {
    component: 'text',
    operators: [...base, like],
  },
  textarea: {
    component: 'text',
    operators: [...base, like],
  },
  wysiwyg: {
    component: 'text',
    operators: [...base, like],
  },
  code: {
    component: 'text',
    operators: [...base, like],
  },
  number: {
    component: 'number',
    operators: [...base, ...numeric],
  },
  date: {
    component: 'date',
    operators: [...base, ...numeric],
  },
  upload: {
    component: 'text',
    operators: [...base],
  },
  relationship: {
    component: 'text',
    operators: [...base],
  },
  select: {
    component: 'text',
    operators: [...base],
  },
  checkbox: {
    component: 'text',
    operators: boolean,
  },
};

export default fieldTypeConditions;
