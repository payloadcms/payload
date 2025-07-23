import type { Timezone } from '../../../config/types.js'

/**
 * List of supported timezones
 *
 * label: Cities - Region (UTC offset)
 * value: IANA timezone name
 *
 * @example
 * { label: 'London (GMT) - Europe (UTC+00:00)', value: 'Europe/London' },
 */
export const defaultTimezones: Timezone[] = [
  { label: 'Alaska - America (UTC-09:00)', value: 'America/Anchorage' },
  { label: 'Almaty - Asia (UTC+06:00)', value: 'Asia/Almaty' },
  { label: 'Arizona (No DST) - America (UTC-07:00)', value: 'America/Phoenix' },
  { label: 'Athens, Bucharest - Europe (UTC+02:00)', value: 'Europe/Athens' },
  { label: 'Auckland, Wellington - Pacific (UTC+12:00)', value: 'Pacific/Auckland' },
  { label: 'Azores - Atlantic (UTC-01:00)', value: 'Atlantic/Azores' },
  { label: 'Baku - Asia (UTC+04:00)', value: 'Asia/Baku' },
  { label: 'Bangkok - Asia (UTC+07:00)', value: 'Asia/Bangkok' },
  { label: 'Beijing, Shanghai - Asia (UTC+08:00)', value: 'Asia/Shanghai' },
  { label: 'Berlin, Paris - Europe (UTC+01:00)', value: 'Europe/Berlin' },
  { label: 'Bogota, Lima, Quito - America (UTC-05:00)', value: 'America/Bogota' },
  { label: 'Brisbane - Australia (UTC+10:00)', value: 'Australia/Brisbane' },
  { label: 'Buenos Aires - America (UTC-03:00)', value: 'America/Buenos_Aires' },
  { label: 'Cairo - Africa (UTC+02:00)', value: 'Africa/Cairo' },
  { label: 'Cape Verde - Atlantic (UTC-01:00)', value: 'Atlantic/Cape_Verde' },
  { label: 'Caracas - America (UTC-04:00)', value: 'America/Caracas' },
  { label: 'Central America - America (UTC-06:00)', value: 'America/Guatemala' },
  { label: 'Central Time (US & Canada) - America (UTC-06:00)', value: 'America/Chicago' },
  { label: 'Chennai, Kolkata, Mumbai, New Delhi - Asia (UTC+05:30)', value: 'Asia/Calcutta' },
  { label: 'Cook Islands - Pacific (UTC-10:00)', value: 'Pacific/Rarotonga' },
  { label: 'Dhaka - Asia (UTC+06:00)', value: 'Asia/Dhaka' },
  { label: 'Dubai - Asia (UTC+04:00)', value: 'Asia/Dubai' },
  { label: 'Eastern Time (US & Canada) - America (UTC-05:00)', value: 'America/New_York' },
  { label: 'Fiji - Pacific (UTC+12:00)', value: 'Pacific/Fiji' },
  { label: 'Gambier Islands - Pacific (UTC-09:00)', value: 'Pacific/Gambier' },
  { label: 'Guam, Port Moresby - Pacific (UTC+10:00)', value: 'Pacific/Guam' },
  { label: 'Hawaii - Pacific (UTC-10:00)', value: 'Pacific/Honolulu' },
  { label: 'Islamabad, Karachi - Asia (UTC+05:00)', value: 'Asia/Karachi' },
  { label: 'Jakarta - Asia (UTC+07:00)', value: 'Asia/Jakarta' },
  { label: 'Lagos - Africa (UTC+01:00)', value: 'Africa/Lagos' },
  { label: 'London, Lisbon (GMT) - Europe (UTC+00:00)', value: 'Europe/London' },
  { label: 'Midway Island, Samoa - Pacific (UTC-11:00)', value: 'Pacific/Midway' },
  { label: 'Moscow, St. Petersburg - Europe (UTC+03:00)', value: 'Europe/Moscow' },
  { label: 'Mountain Time (US & Canada) - America (UTC-07:00)', value: 'America/Denver' },
  { label: 'New Caledonia - Pacific (UTC+11:00)', value: 'Pacific/Noumea' },
  { label: 'Niue - Pacific (UTC-11:00)', value: 'Pacific/Niue' },
  { label: 'Pacific Time (US & Canada) - America (UTC-08:00)', value: 'America/Los_Angeles' },
  { label: 'Riyadh - Asia (UTC+03:00)', value: 'Asia/Riyadh' },
  { label: 'Sao Paolo, Brasilia - America (UTC-03:00)', value: 'America/Sao_Paulo' },
  { label: 'Santiago - America (UTC-04:00)', value: 'America/Santiago' },
  { label: 'Seoul - Asia (UTC+09:00)', value: 'Asia/Seoul' },
  { label: 'Singapore - Asia (UTC+08:00)', value: 'Asia/Singapore' },
  { label: 'South Georgia - Atlantic (UTC-02:00)', value: 'Atlantic/South_Georgia' },
  { label: 'Sydney, Melbourne - Australia (UTC+10:00)', value: 'Australia/Sydney' },
  { label: 'Tashkent - Asia (UTC+05:00)', value: 'Asia/Tashkent' },
  { label: 'Tijuana, Baja California - America (UTC-08:00)', value: 'America/Tijuana' },
  { label: 'Tokyo, Osaka, Sapporo - Asia (UTC+09:00)', value: 'Asia/Tokyo' },
]
