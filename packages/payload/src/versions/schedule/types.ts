import type { CollectionSlug, GlobalSlug } from '../../index.js'

export type SchedulePublishTaskInput = {
  doc?: {
    relationTo: CollectionSlug
    value: number | string
  }
  global?: GlobalSlug
  locale?: string
  type: string
}
