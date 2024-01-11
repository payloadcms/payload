import React from 'react'

import { deepMerge } from '../../../../utilities/deepMerge'

/**
 * Creates a higher-order component (HOC) that merges predefined properties (`toMergeIntoProps`)
 * with any properties passed to the resulting component.
 *
 * Use this when you want to pre-specify some props for a component, while also allowing users to
 * pass in their own props. The HOC ensures the passed props and predefined props are combined before
 * rendering the original component.
 *
 * @example
 * const PredefinedComponent = getMergedPropsComponent({
 *   Component: OriginalComponent,
 *   toMergeIntoProps: { someExtraValue: 5 }
 * });
 * // Using <PredefinedComponent customProp="value" /> will result in
 * // <OriginalComponent customProp="value" someExtraValue={5} />
 *
 * @returns A higher-order component with combined properties.
 */
export function withMergedProps<ToMergeIntoProps, CompleteReturnProps>({
  Component,
  toMergeIntoProps,
}: {
  Component: React.FC<CompleteReturnProps>
  toMergeIntoProps: ToMergeIntoProps
}): React.FC<CompleteReturnProps> {
  // A wrapper around the args.Component to inject the args.toMergeArgs as props, which are merged with the passed props
  const MergedPropsComponent: React.FC<CompleteReturnProps> = (passedProps) => {
    const mergedProps = deepMerge(toMergeIntoProps, passedProps)
    return <Component {...mergedProps} />
  }

  return MergedPropsComponent
}
