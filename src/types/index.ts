export type Where = {
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Document = any;

export type Operator = 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'greater_than'
  | 'greater_than_equals'
  | 'less_than'
  | 'less_than_equals'
  | 'like'
