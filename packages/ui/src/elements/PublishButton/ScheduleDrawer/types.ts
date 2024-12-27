export type PublishType = 'publish' | 'unpublish'

export type UpcomingEvent = {
  id: number | string
  input: {
    locale?: string
    type: PublishType
  }
  waitUntil: Date
}
