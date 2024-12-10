import type { ComplexityEstimator, ComplexityEstimatorArgs } from '../../QueryComplexity.js'

export const simpleEstimator = (options?: { defaultComplexity?: number }): ComplexityEstimator => {
  const defaultComplexity =
    options && typeof options.defaultComplexity === 'number' ? options.defaultComplexity : 1
  return (args: ComplexityEstimatorArgs): number | void => {
    return defaultComplexity + args.childComplexity
  }
}
