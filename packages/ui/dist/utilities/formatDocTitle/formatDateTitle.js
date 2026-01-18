import { TZDateMini as TZDate } from '@date-fns/tz/date/mini';
import { format, formatDistanceToNow, transpose } from 'date-fns';
export const formatDate = ({
  date,
  i18n,
  pattern,
  timezone
}) => {
  const theDate = new TZDate(new Date(date));
  if (timezone) {
    const DateWithOriginalTz = TZDate.tz(timezone);
    const modifiedDate = theDate.withTimeZone(timezone);
    // Transpose the date to the selected timezone
    const dateWithTimezone = transpose(modifiedDate, DateWithOriginalTz);
    // Transpose the date to the user's timezone - this is necessary because the react-datepicker component insists on displaying the date in the user's timezone
    return i18n.dateFNS ? format(dateWithTimezone, pattern, {
      locale: i18n.dateFNS
    }) : `${i18n.t('general:loading')}...`;
  }
  return i18n.dateFNS ? format(theDate, pattern, {
    locale: i18n.dateFNS
  }) : `${i18n.t('general:loading')}...`;
};
export const formatTimeToNow = ({
  date,
  i18n
}) => {
  const theDate = typeof date === 'string' ? new Date(date) : date;
  return i18n?.dateFNS ? formatDistanceToNow(theDate, {
    locale: i18n.dateFNS
  }) : `${i18n.t('general:loading')}...`;
};
//# sourceMappingURL=formatDateTitle.js.map