import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Field, fieldAffectsData,
  fieldHasSubFields, FieldWithPath,
  tabHasName,
} from '../../../../fields/config/types';
import ReactSelect from '../ReactSelect';
import { getTranslation } from '../../../../utilities/getTranslation';
import Label from '../../forms/Label';
import { useForm } from '../../forms/Form/context';
import { createNestedFieldPath } from '../../forms/Form/createNestedFieldPath';

import './index.scss';

const baseClass = 'field-select';

type Props = {
  fields: Field[];
  setSelected: (fields: FieldWithPath[]) => void
}

const combineLabel = (prefix, field, i18n): string => (
  `${prefix === '' ? '' : `${prefix} > `}${getTranslation(field.label || field.name, i18n) || ''}`
);
const reduceFields = (fields: Field[], i18n, path = '', labelPrefix = ''): {label: string, value: FieldWithPath}[] => (
  fields.reduce((fieldsToUse, field) => {
    // escape for a variety of reasons
    if (fieldAffectsData(field) && (field.admin?.disableBulkEdit || field.unique || field.hidden || field.admin?.hidden || field.admin?.readOnly)) {
      return fieldsToUse;
    }
    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFields(field.fields, i18n, createNestedFieldPath(path, field), combineLabel(labelPrefix, field, i18n)),
      ];
    }
    if (field.type === 'tabs') {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          return [
            ...tabFields,
            ...(reduceFields(tab.fields, i18n, tabHasName(tab) ? createNestedFieldPath(path, field) : path, combineLabel(labelPrefix, field, i18n))),
          ];
        }, []),
      ];
    }
    const formattedField = {
      label: combineLabel(labelPrefix, field, i18n),
      value: {
        ...field,
        path: createNestedFieldPath(path, field),
      },
    };

    return [
      ...fieldsToUse,
      formattedField,
    ];
  }, []));
export const FieldSelect: React.FC<Props> = ({
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
    // remove deselected values from form state
    if (selected === null || Object.keys(activeFields).length > selected.length) {
      Object.keys(activeFields).forEach((path) => {
        if (selected === null || !selected.find((field) => {
          return field.value.path === path;
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
