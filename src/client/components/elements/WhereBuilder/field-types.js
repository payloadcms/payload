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
    component: 'Text',
    operators: [...base, like],
  },
  email: {
    component: 'Text',
    operators: [...base, like],
  },
  textarea: {
    component: 'Text',
    operators: [...base, like],
  },
  wysiwyg: {
    component: 'Text',
    operators: [...base, like],
  },
  code: {
    component: 'Text',
    operators: [...base, like],
  },
  number: {
    component: 'Number',
    operators: [...base, ...numeric],
  },
  date: {
    component: 'Date',
    operators: [...base, ...numeric],
  },
  upload: {
    component: 'Text',
    operators: [...base],
  },
  relationship: {
    component: 'Text',
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
