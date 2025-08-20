import type { ServerProps } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

import { TenantSelectorClient } from './index.client.js'

type Props = {
  enabledSlugs: string[]
  label: MultiTenantPluginConfig['tenantSelectorLabel']
} & ServerProps
export const TenantSelector = (props: Props) => {
  const { enabledSlugs, label, params, viewType } = props
  const enabled = Boolean(
    params?.segments &&
      Array.isArray(params.segments) &&
      params.segments[0] === 'collections' &&
      params.segments[1] &&
      enabledSlugs.includes(params.segments[1]),
  )

  return <TenantSelectorClient disabled={!enabled} label={label} viewType={viewType} />
}
