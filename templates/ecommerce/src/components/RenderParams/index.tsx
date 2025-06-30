import { Suspense } from 'react'

import type { Props } from './Component'

import { RenderParamsComponent } from './Component'

// Using `useSearchParams` from `next/navigation` causes the entire route to de-optimize into client-side rendering
// To fix this, we wrap the component in a `Suspense` component
// See https://nextjs.org/docs/messages/deopted-into-client-rendering for more info

export const RenderParams: React.FC<Props> = (props) => {
  return (
    <Suspense fallback={null}>
      <RenderParamsComponent {...props} />
    </Suspense>
  )
}
