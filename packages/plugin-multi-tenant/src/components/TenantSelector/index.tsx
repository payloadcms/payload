import type { ServerProps } from 'payload'

import type { MultiTenantPluginConfig, TenantValue } from '../../types.js'

import { TenantSelectorClient } from './index.client.js'

type Props = {
  enabledSlugs: string[]
  label: MultiTenantPluginConfig['tenantSelectorLabel']
  tenantFieldName?: string
} & ServerProps
export const TenantSelector = async (props: Props) => {
  const {
    documentSubViewType,
    label,
    params,
    payload,
    tenantFieldName = 'tenant',
    user,
    viewType,
  } = props
  const segments = params?.segments
  let documentContext: { tenantValue?: TenantValue } | undefined

  if (
    Array.isArray(segments) &&
    segments[0] === 'collections' &&
    documentSubViewType &&
    documentSubViewType !== 'default' &&
    user
  ) {
    const collectionSlug = segments[1]
    const docID = segments[2] === 'trash' ? segments[3] : segments[2]
    const collection = collectionSlug ? payload.collections[collectionSlug]?.config : undefined

    if (
      docID &&
      collectionSlug &&
      props.enabledSlugs.includes(collectionSlug) &&
      collection?.fields.some((field) => 'name' in field && field.name === tenantFieldName)
    ) {
      const { docs } = await payload.find({
        collection: collectionSlug,
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        select: { [tenantFieldName]: true },
        trash: segments[2] === 'trash',
        user,
        where: { id: { equals: docID } },
      })

      if (docs[0]) {
        documentContext = { tenantValue: docs[0][tenantFieldName] as TenantValue | undefined }
      }
    }
  }

  return (
    <TenantSelectorClient documentContext={documentContext} label={label} viewType={viewType} />
  )
}
