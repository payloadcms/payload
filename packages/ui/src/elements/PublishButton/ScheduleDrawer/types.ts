export type PublishType = 'publish' | 'unpublish'

export type UpcomingEvent = {
  id: number | string
  input: {
    type: PublishType
  }
  waitUntil: Date
}
