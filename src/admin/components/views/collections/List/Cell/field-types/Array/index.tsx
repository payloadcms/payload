import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrayField } from '../../../../../../../../fields/config/types';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';

type Props = {
  data: Record<string, unknown>
  field: ArrayField
}

const ArrayCell: React.FC<Props> = ({ data, field }) => {
  const { t, i18n } = useTranslation('general');
  const arrayFields = data ?? [];
  const label = `${arrayFields.length} ${getTranslation(field?.labels?.plural || t('rows'), i18n)}`;

  return (
    <span>{label}</span>
  );
};

export default ArrayCell;
