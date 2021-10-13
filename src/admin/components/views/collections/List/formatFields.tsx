import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field, fieldIsNamed } from '../../../../../fields/config/types';

const formatFields = (config: SanitizedCollectionConfig): Field[] => {
  const hasID = config.fields.findIndex((field) => fieldIsNamed(field) && field.name === 'id') > -1;
  let fields: Field[] = config.fields.reduce((formatted, field) => {
    if (field.hidden === true || field?.admin?.disabled === true) {
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
        label: 'Created At',
        type: 'date',
      }, {
        name: 'updatedAt',
        label: 'Updated At',
        type: 'date',
      },
    ]);
  }

  if (config.upload) {
    fields = fields.concat([
      {
        name: 'filename',
        label: 'Filename',
        type: 'text',
      },
    ]);
  }

  return fields;
};

export default formatFields;
