import { isReactServerComponentOrFunction, serverProps } from 'payload/shared'
import React from 'react'

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
 *
 * @param Component - The original component to wrap.
 * @param sanitizeServerOnlyProps - If true, server-only props will be removed from the merged props. @default true if the component is not a server component, false otherwise.
 * @param toMergeIntoProps - The properties to merge into the passed props.
 */
export function withMergedProps<ToMergeIntoProps, CompleteReturnProps>({
  Component,
  sanitizeServerOnlyProps,
  toMergeIntoProps,
}: {
  Component: React.FC<CompleteReturnProps>
  sanitizeServerOnlyProps?: boolean
  toMergeIntoProps: ToMergeIntoProps
}): React.FC<CompleteReturnProps> {
  if (sanitizeServerOnlyProps === undefined) {
    sanitizeServerOnlyProps = !isReactServerComponentOrFunction(Component)
  }
  // A wrapper around the args.Component to inject the args.toMergeArgs as props, which are merged with the passed props
  const MergedPropsComponent: React.FC<CompleteReturnProps> = (passedProps) => {
    const mergedProps = simpleMergeProps(passedProps, toMergeIntoProps) as CompleteReturnProps

    if (sanitizeServerOnlyProps) {
      serverProps.forEach((prop) => {
        delete mergedProps[prop]
      })
    }

    return <Component {...mergedProps} />
  }

  return MergedPropsComponent
}

function simpleMergeProps(props, toMerge) {
  return { ...props, ...toMerge }
}
