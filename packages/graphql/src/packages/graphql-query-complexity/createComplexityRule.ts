import type { ValidationContext } from 'graphql'

import type { QueryComplexityOptions } from './QueryComplexity.js'

import { QueryComplexity } from './QueryComplexity.js'

export function createComplexityRule(
  options: QueryComplexityOptions,
): (context: ValidationContext) => QueryComplexity {
  return (context: ValidationContext): QueryComplexity => {
    return new QueryComplexity(context, options)
  }
}
