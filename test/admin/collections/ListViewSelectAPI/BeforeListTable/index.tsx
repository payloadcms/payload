'use client'

import { useListQuery } from '@payloadcms/ui'

export const BeforeListTable = () => {
  const { data } = useListQuery()

  return <p id="table-state">{JSON.stringify(data?.docs || [])}</p>
}
