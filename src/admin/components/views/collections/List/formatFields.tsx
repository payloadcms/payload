import React from 'react';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types';

const formatFields = (config: SanitizedCollectionConfig): Field[] => {
  const hasID = config.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1;
  const fields: Field[] = config.fields.reduce((formatted, field) => {
    if (!fieldIsPresentationalOnly(field) && (field.hidden === true || field?.admin?.disabled === true)) {
      return formatted;
    }

    return [
      ...formatted,
      field,
    ];
  }, hasID ? [] : [{
    name: 'id',
    label: 'ID',
    type: 'text',
    admin: {
      disableBulkEdit: true,
    },
  }]);

  return fields;
};

export default formatFields;
