import type { DateField } from '../../payload-types'

export const dateDoc: Partial<DateField> = {
  default: '2022-08-12T10:00:00.000+00:00',
  timeOnly: '2022-08-12T10:00:00.157+00:00',
  timeOnlyWithCustomFormat: '2022-08-12T10:00:00.157+00:00',
  dayOnly: '2022-08-11T22:00:00.000+00:00',
  dayAndTime: '2022-08-12T10:00:00.052+00:00',
  monthOnly: '2022-07-31T22:00:00.000+00:00',
}
