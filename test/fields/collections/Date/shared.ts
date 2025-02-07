import type { DateField } from '../../payload-types.js'

export const dateDoc: Partial<DateField> = {
  default: '2022-08-12T10:00:00.000+00:00',
  timeOnly: '2022-08-12T10:00:00.157+00:00',
  timeOnlyWithCustomFormat: '2022-08-12T10:00:00.157+00:00',
  dayOnly: '2022-08-11T22:00:00.000+00:00',
  dayAndTime: '2022-08-12T10:00:00.052+00:00',
  monthOnly: '2022-07-31T22:00:00.000+00:00',
  defaultWithTimezone: '2027-08-12T10:00:00.000+00:00',
  defaultWithTimezone_tz: 'Europe/London',
  dayAndTimeWithTimezone: '2027-08-12T01:00:00.000+00:00', // 10AM tokyo time — we will test for this in e2e
  dayAndTimeWithTimezone_tz: 'Asia/Tokyo',
  timezoneBlocks: [
    {
      blockType: 'dateBlock',
      dayAndTime: '2025-01-31T09:00:00.000Z',
      dayAndTime_tz: 'Europe/Berlin',
    },
  ],
  timezoneArray: [
    {
      dayAndTime: '2025-01-31T09:00:00.549Z',
      dayAndTime_tz: 'Europe/Berlin',
    },
  ],
}
