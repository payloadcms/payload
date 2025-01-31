import type { DateFieldsWithTimezone } from '../../payload-types.js'

export const dateWithTimezonesDoc: Partial<DateFieldsWithTimezone> = {
  default: '2027-08-12T10:00:00.000+00:00',
  default_timezone: 'Europe/London',
  dayAndTime: '2027-08-12T01:00:00.000+00:00', // 10AM tokyo time — we will test for this in e2e
  dayAndTime_timezone: 'Asia/Tokyo',
  blocks: [
    {
      blockType: 'dateBlock',
      dayAndTime: '2025-01-31T09:00:00.000Z',
      dayAndTime_timezone: 'Europe/Berlin',
    },
  ],
  array: [
    {
      dayAndTime: '2025-01-31T09:00:00.549Z',
      dayAndTime_timezone: 'Europe/Berlin',
    },
  ],
}
