import { TFunction } from 'react-i18next';
import React from 'react';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types';
import UploadCell from './Cell/field-types/Upload';
import { Props } from './Cell/types';

const formatFields = (config: SanitizedCollectionConfig, t: TFunction): Field[] => {
  const hasID = config.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1;
  const fields: Field[] = config.fields.reduce((formatted, field) => {
    if (!fieldIsPresentationalOnly(field) && (field.hidden === true || field?.admin?.disabled === true)) {
      return formatted;
    }

    if (config.upload && fieldAffectsData(field) && field.name === 'filename') {
      const Cell: React.FC<Props> = (props) => (
        <UploadCell
          collection={config}
          {...props}
        />
      );
      return [
        ...formatted,
        {
          ...field,
          admin: {
            ...field.admin,
            components: {
              ...field.admin?.components || {},
              Cell: field.admin?.components?.Cell || Cell,
            },
          },
        },
      ];
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

  if (config.timestamps) {
    fields.push(
      {
        name: 'createdAt',
        label: t('general:createdAt'),
        type: 'date',
        admin: {
          disableBulkEdit: true,
        },
      }, {
        name: 'updatedAt',
        label: t('general:updatedAt'),
        type: 'date',
        admin: {
          disableBulkEdit: true,
        },
      },
    );
  }

  return fields;
};

export default formatFields;
