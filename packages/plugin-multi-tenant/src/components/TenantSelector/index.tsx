import type { ServerProps } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

import { TenantSelectorClient } from './index.client.js'

type Props = ServerProps & {
  enabledSlugs: string[]
  label: MultiTenantPluginConfig['tenantSelectorLabel']
}
export const TenantSelector = (props: Props) => {
  const { label, viewType } = props

  return <TenantSelectorClient label={label} viewType={viewType} />
}
