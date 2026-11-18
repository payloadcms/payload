import type { Config } from 'payload'

type TimezonesConfig = NonNullable<NonNullable<Config['admin']>['timezones']>
type Timezone = { label: string; value: string }

/**
 * Time zones for date fields such as an event's start date: Payload's default list plus cities it
 * lacks, sorted by UTC offset. Add a city here when an event's time zone is missing from the picker.
 */
const extraTimezones: Timezone[] = [
  { label: '(UTC-06:00) Guadalajara, Mexico City', value: 'America/Mexico_City' },
  { label: '(UTC+01:00) Paris', value: 'Europe/Paris' },
  { label: '(UTC+01:00) Rome, Milan', value: 'Europe/Rome' },
  { label: '(UTC+01:00) Warsaw', value: 'Europe/Warsaw' },
  { label: '(UTC+01:00) Zurich, Geneva, Basel', value: 'Europe/Zurich' },
  { label: '(UTC+03:00) Istanbul', value: 'Europe/Istanbul' },
  { label: '(UTC+03:00) Bahrain', value: 'Asia/Bahrain' },
  { label: '(UTC+03:00) Qatar', value: 'Asia/Qatar' },
  { label: '(UTC+05:30) Colombo', value: 'Asia/Colombo' },
  { label: '(UTC+08:00) Hong Kong', value: 'Asia/Hong_Kong' },
  { label: '(UTC+08:00) Kuala Lumpur', value: 'Asia/Kuala_Lumpur' },
  { label: '(UTC+08:00) Taipei', value: 'Asia/Taipei' },
]

const utcOffset = ({ label }: Timezone) => {
  const match = /^\(UTC([+-])(\d{2}):(\d{2})\)/.exec(label)
  return match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0
}

export const timezones: TimezonesConfig = {
  supportedTimezones: ({ defaultTimezones }) =>
    [
      ...defaultTimezones,
      ...extraTimezones.filter(({ value }) => !defaultTimezones.some((tz) => tz.value === value)),
    ]
      // Stable sort: keeps Payload's order within the same offset
      .sort((a, b) => utcOffset(a) - utcOffset(b)),
}
