import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config';
import { formatDate } from '../../../../../../../utilities/formatDate';

const DateCell = ({ data, field }) => {
  const { admin: { dateFormat: dateFormatFromConfig } } = useConfig();

  const dateFormat = field?.admin?.date?.displayFormat || dateFormatFromConfig;

  const { i18n } = useTranslation();

  return (
    <span>
      {data && formatDate(data, dateFormat, i18n?.language)}
    </span>
  );
};

export default DateCell;
