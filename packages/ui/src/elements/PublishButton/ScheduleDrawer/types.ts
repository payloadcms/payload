export type PublishType = 'publish' | 'unpublish'

export type UpcomingEvent = {
  id: number | string
  input: {
    locale?: string
    timezone?: string
    type: PublishType
  }
  waitUntil: Date
}
