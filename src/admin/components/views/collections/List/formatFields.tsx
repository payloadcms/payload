import { TFunction } from 'react-i18next';
import React from 'react';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types';
import UploadCell from './Cell/field-types/Upload';
import { Props } from './Cell/types';

const formatFields = (config: SanitizedCollectionConfig, t: TFunction): Field[] => {
  const hasID = config.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1;
  let fields: Field[] = config.fields.reduce((formatted, field) => {
    if (!fieldIsPresentationalOnly(field) && (field.hidden === true || field?.admin?.disabled === true)) {
      return formatted;
    }

    return [
      ...formatted,
      field,
    ];
  }, hasID ? [] : [{ name: 'id', label: 'ID', type: 'text' }]);

  if (config.timestamps) {
    fields = fields.concat([
      {
        name: 'createdAt',
        label: t('general:createdAt'),
        type: 'date',
      }, {
        name: 'updatedAt',
        label: t('general:updatedAt'),
        type: 'date',
      },
    ]);
  }

  if (config.upload) {
    const Cell: React.FC<Props> = (props) => (
      <UploadCell
        collection={config}
        {...props}
      />
    );
    fields = fields.filter((field) => (fieldAffectsData(field) && field.name !== 'filename')).concat([
      {
        name: 'filename',
        label: t('upload:fileName'),
        type: 'text',
        admin: {
          disableBulkEdit: true,
          components: {
            Cell,
          },
        },
      },
    ]);
  }

  return fields;
};

export default formatFields;
