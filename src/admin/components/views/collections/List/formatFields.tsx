import { TFunction } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldAffectsData, fieldIsPresentationalOnly } from '../../../../../fields/config/types';

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
    fields = fields.concat([
      {
        name: 'filename',
        label: t('upload:fileName'),
        type: 'text',
      },
    ]);
  }

  return fields;
};

export default formatFields;
