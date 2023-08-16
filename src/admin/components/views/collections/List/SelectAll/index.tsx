import React from 'react';
import { useTranslation } from 'react-i18next';
import { SelectAllStatus } from '../SelectionProvider/types';
import { useSelection } from '../SelectionProvider';
import { CheckboxInput } from '../../../../forms/field-types/Checkbox/Input';

const SelectAll: React.FC = () => {
  const { t } = useTranslation('general');
  const { selectAll, toggleAll } = useSelection();

  return (
    <CheckboxInput
      id="select-all"
      aria-label={selectAll === SelectAllStatus.None ? t('selectAllRows') : t('deselectAllRows')}
      checked={selectAll === SelectAllStatus.AllInPage || selectAll === SelectAllStatus.AllAvailable}
      partialChecked={selectAll === SelectAllStatus.Some}
      onToggle={() => toggleAll()}
    />
  );
};

export default SelectAll;
