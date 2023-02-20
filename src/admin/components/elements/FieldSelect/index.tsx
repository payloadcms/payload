import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, fieldAffectsData } from '../../../../fields/config/types';
import ReactSelect from '../ReactSelect';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import { getTranslation } from '../../../../utilities/getTranslation';
import Label from '../../forms/Label';
import { useForm } from '../../forms/Form/context';
import { createNestedFieldPath } from '../../forms/Form/createNestedFieldPath';

import './index.scss';

const baseClass = 'field-select';

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
    // TODO:
    // tabs
    // groups
    if (fieldAffectsData(field) && (field.unique || field.hidden || field.admin.hidden || field.admin.readOnly || field.admin.disableBulkEdit)) {
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
export const Index: React.FC<Props> = ({
  fields,
  setSelected,
}) => {
  const { t, i18n } = useTranslation('general');
  const [options] = useState(() => reduceFields(fields, i18n));
  const { getFields, dispatchFields } = useForm();
  const handleChange = (selected) => {
    const activeFields = getFields();
    if (selected === null) {
      setSelected([]);
    } else {
      setSelected(selected.map(({ value }) => value));
    }
    if (selected === null || Object.keys(activeFields).length > selected.length) {
      Object.keys(activeFields).forEach((path) => {
        if (selected === null || !selected.find((field) => {
          return createNestedFieldPath(field.value.path, field.value) === path;
        })) {
          dispatchFields({
            type: 'REMOVE',
            path,
          });
        }
      });
    }
  };

  return (
    <div className={baseClass}>
      <Label label={t('fields:selectFieldsToEdit')} />
      <ReactSelect
        options={options}
        isMulti
        onChange={handleChange}
      />
    </div>
  );
};
