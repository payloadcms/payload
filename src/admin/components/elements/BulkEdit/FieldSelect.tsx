import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, fieldAffectsData } from '../../../../fields/config/types';
import ReactSelect from '../ReactSelect';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import { getTranslation } from '../../../../utilities/getTranslation';
import { baseClass } from '../ListDrawer';
import Label from '../../forms/Label';

type Props = {
  fields: Field[];
  setSelected: (fields: Field[]) => void
}

const filterFields = ['id', 'createdAt', 'updatedAt', '_status'];
const reduceFields = (fields, i18n) => flattenTopLevelFields(fields)
  .reduce((reduced, field) => {
    if (filterFields.includes(field.name)) {
      return reduced;
    }
    if (fieldAffectsData(field) && (field.hidden || field.admin.readOnly)) {
      return reduced;
    }
    const formattedField = {
      label: getTranslation(field.label || field.name, i18n),
      value: {
        ...field,
        path: '',
      },
    };

    return [
      ...reduced,
      formattedField,
    ];
  }, []);
export const FieldSelect: React.FC<Props> = ({
  fields,
  setSelected,
}) => {
  const { t, i18n } = useTranslation('general');
  const [options] = useState(() => reduceFields(fields, i18n));

  return (
    <div className={`${baseClass}__select-collection-wrap`}>
      <Label label={t('fields:selectFieldsToEdit')} />
      <ReactSelect
        options={options}
        isMulti
        onChange={(selected) => {
          if (selected === null) {
            setSelected([]);
          } else {
            setSelected(selected.map(({ value }) => value));
          }
        }}
      />
    </div>
  );
};
