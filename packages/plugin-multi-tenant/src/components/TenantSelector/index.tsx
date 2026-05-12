import type { ServerProps } from 'payload'

import { TenantSelectorClient } from './index.client.js'

type Props = {
  enabledSlugs: string[]
} & ServerProps
export const TenantSelector = (props: Props) => {
  const { viewType } = props

  return <TenantSelectorClient viewType={viewType} />
}
