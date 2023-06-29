export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const monthNamesAbbr = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
]

const formatOptions: { [key: string]: Intl.DateTimeFormatOptions } = {
  longDateStamp: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  shortDateStamp: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  dateAndTime: {
    year: undefined,
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    timeZoneName: 'short',
    timeZone: 'America/Los_Angeles',
  },
}

interface Args {
  date: string | Date
  format?: 'longDateStamp' | 'shortDateStamp' | 'dateAndTime'
  timeZone?: string
}
export function formatDate(args: Args): string {
  const { date, format = 'longDateStamp' } = args

  try {
    const dateObj = new Date(new Date(date).toLocaleString('en-US'))

    const options = formatOptions[format]
    return new Intl.DateTimeFormat('en-US', options).format(dateObj)
  } catch (e: unknown) {
    console.error('Error formatting date', e) // eslint-disable-line no-console
    return String(date)
  }
}
