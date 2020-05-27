import { buildASTSchema } from 'graphql';

const boolean = [
  {
    label: 'Equals',
    value: 'equals',
  },
  {
    label: 'Not Equals',
    value: 'not-equals',
  },
];

const base = [
  ...boolean,
  {
    label: 'In',
    value: 'in',
  },
  {
    label: 'Not In',
    value: 'not-in',
  },
];

const numeric = [
  ...base,
  {
    label: 'Greater Than',
    value: 'greater_than',
  },
  {
    label: 'Less Than',
    value: 'less_than',
  },
  {
    label: 'Less Than Equals',
    value: 'less_than_equals',
  },
  {
    label: 'Greater Than Equals',
    value: 'greater_than_equals',
  },
];

const like = {
  label: 'like',
  value: 'Like',
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

module.exports = fieldTypeConditions;
