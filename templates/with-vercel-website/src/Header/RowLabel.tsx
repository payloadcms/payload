'use client'
import { Header } from '@/payload-types'
import { useRowLabel } from '@payloadcms/ui'
import type { ArrayFieldClientProps } from 'payload'

export const RowLabel: React.FC<ArrayFieldClientProps> = () => {
  const data = useRowLabel<NonNullable<Header['navItems']>[number]>()

  const label = data?.data?.link?.label
    ? `Nav item ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data?.data?.link?.label}`
    : 'Row'

  return <div>{label}</div>
}
