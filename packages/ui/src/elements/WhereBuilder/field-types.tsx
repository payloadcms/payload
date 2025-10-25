'use client'

import type { ClientField } from 'payload'

const equalsOperators = [
  {
    label: 'equals',
    value: 'equals',
  },
  {
    label: 'isNotEqualTo',
    value: 'not_equals',
  },
]

export const arrayOperators = [
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

const base = [...equalsOperators, ...arrayOperators]

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
  ...equalsOperators,
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

const notLike = {
  label: 'isNotLike',
  value: 'not_like',
}

const contains = {
  label: 'contains',
  value: 'contains',
}

export const fieldTypeConditions: {
  [key: string]: {
    component: string
    operators: { label: string; value: string }[]
  }
} = {
  checkbox: {
    component: 'Text',
    operators: [...equalsOperators],
  },
  code: {
    component: 'Text',
    operators: [...base, like, notLike, contains],
  },
  date: {
    component: 'Date',
    operators: [...numeric],
  },
  email: {
    component: 'Text',
    operators: [...base, contains],
  },
  json: {
    component: 'Text',
    operators: [...base, like, contains, notLike, within, intersects],
  },
  number: {
    component: 'Number',
    operators: [...numeric],
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
    operators: [...base, like, notLike, contains],
  },
  select: {
    component: 'Select',
    operators: [...base],
  },
  text: {
    component: 'Text',
    operators: [...base, like, notLike, contains],
  },
  textarea: {
    component: 'Text',
    operators: [...base, like, notLike, contains],
  },
  upload: {
    component: 'Text',
    operators: [...base],
  },
}

export const getValidFieldOperators = ({
  field,
  operator,
}: {
  field: ClientField
  operator?: string
}): {
  validOperator: string
  validOperators: {
    label: string
    value: string
  }[]
} => {
  let validOperators: {
    label: string
    value: string
  }[] = []

  if (field.type === 'relationship' && Array.isArray(field.relationTo)) {
    if ('hasMany' in field && field.hasMany) {
      validOperators = [...equalsOperators]
    } else {
      validOperators = [...base]
    }
  } else {
    validOperators = [...fieldTypeConditions[field.type].operators]
  }

  return {
    validOperator:
      operator && validOperators.find(({ value }) => value === operator)
        ? operator
        : validOperators[0].value,
    validOperators,
  }
}
