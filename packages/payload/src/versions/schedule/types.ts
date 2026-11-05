import type { CollectionSlug, GlobalSlug } from '../../index.js'

export type SchedulePublishTaskUser =
  | {
      relationTo: CollectionSlug
      value: number | string
    }
  | number
  | string

export type SchedulePublishTaskInput = {
  doc?: {
    relationTo: CollectionSlug
    value: string
  }
  global?: GlobalSlug
  locale?: string
  type?: string
  user?: SchedulePublishTaskUser
}
