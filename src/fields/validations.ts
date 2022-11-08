import defaultRichTextValue from './richText/defaultValue';
import {
  ArrayField,
  BlockField,
  CheckboxField,
  CodeField,
  DateField,
  EmailField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RelationshipValue,
  RichTextField,
  SelectField,
  TextareaField,
  TextField,
  UploadField,
  Validate,
  fieldAffectsData,
} from './config/types';
import { TypeWithID } from '../collections/config/types';
import canUseDOM from '../utilities/canUseDOM';
import { isValidID } from '../utilities/isValidID';
import { getIDType } from '../utilities/getIDType';

export const number: Validate<unknown, unknown, NumberField> = (value: string, { i18n, required, min, max }) => {
  const parsedValue = parseFloat(value);

  if ((value && typeof parsedValue !== 'number') || (required && Number.isNaN(parsedValue)) || (value && Number.isNaN(parsedValue))) {
    return i18n.t('validation:enterNumber');
  }

  if (typeof max === 'number' && parsedValue > max) {
    return i18n.t('validation:greaterThanMax', { value, max });
  }

  if (typeof min === 'number' && parsedValue < min) {
    return i18n.t('validation:lessThanMin', { value, min });
  }

  if (required && typeof parsedValue !== 'number') {
    return i18n.t('validation:required');
  }

  return true;
};

export const text: Validate<unknown, unknown, TextField> = (value: string, { i18n, minLength, maxLength: fieldMaxLength, required, payload }) => {
  let maxLength: number;

  if (typeof payload?.config?.defaultMaxTextLength === 'number') maxLength = payload.config.defaultMaxTextLength;
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
  if (value && maxLength && value.length > maxLength) {
    return i18n.t('validation:shorterThanMax', { maxLength });
  }

  if (value && minLength && value?.length < minLength) {
    return i18n.t('validation:longerThanMin', { minLength });
  }

  if (required) {
    if (typeof value !== 'string' || value?.length === 0) {
      return i18n.t('validation:required');
    }
  }

  return true;
};

export const password: Validate<unknown, unknown, TextField> = (value: string, { i18n, required, maxLength: fieldMaxLength, minLength, payload }) => {
  let maxLength: number;

  if (typeof payload?.config?.defaultMaxTextLength === 'number') maxLength = payload.config.defaultMaxTextLength;
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;

  if (value && maxLength && value.length > maxLength) {
    return i18n.t('validation:shorterThanMax', { maxLength });
  }

  if (value && minLength && value.length < minLength) {
    return i18n.t('validation:longerThanMin', { minLength });
  }

  if (required && !value) {
    return i18n.t('validation:required');
  }

  return true;
};

export const email: Validate<unknown, unknown, EmailField> = (value: string, { i18n, required }) => {
  if ((value && !/\S+@\S+\.\S+/.test(value))
    || (!value && required)) {
    return i18n.t('validation:emailAddress');
  }

  return true;
};

export const textarea: Validate<unknown, unknown, TextareaField> = (value: string, {
  i18n,
  required,
  maxLength: fieldMaxLength,
  minLength,
  payload,
}) => {
  let maxLength: number;

  if (typeof payload?.config?.defaultMaxTextLength === 'number') maxLength = payload.config.defaultMaxTextLength;
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
  if (value && maxLength && value.length > maxLength) {
    return i18n.t('validation:shorterThanMax', { maxLength });
  }

  if (value && minLength && value.length < minLength) {
    return i18n.t('validation:longerThanMin', { minLength });
  }

  if (required && !value) {
    return i18n.t('validation:required');
  }

  return true;
};

export const code: Validate<unknown, unknown, CodeField> = (value: string, { i18n, required }) => {
  if (required && value === undefined) {
    return i18n.t('validation:required');
  }

  return true;
};

export const richText: Validate<unknown, unknown, RichTextField> = (value, { i18n, required }) => {
  if (required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue);
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true;
    return i18n.t('validation:required');
  }

  return true;
};

export const checkbox: Validate<unknown, unknown, CheckboxField> = (value: boolean, { i18n, required }) => {
  if ((value && typeof value !== 'boolean')
    || (required && typeof value !== 'boolean')) {
    return i18n.t('validation:trueOrFalse');
  }

  return true;
};

export const date: Validate<unknown, unknown, DateField> = (value, { i18n, required }) => {
  if (value && !isNaN(Date.parse(value.toString()))) { /* eslint-disable-line */
    return true;
  }

  if (value) {
    return i18n.t('validation:notValidDate', { value });
  }

  if (required) {
    return i18n.t('validation:required');
  }

  return true;
};

const validateFilterOptions: Validate = async (value, { i18n, filterOptions, id, user, data, siblingData, relationTo, payload }) => {
  if (!canUseDOM && typeof filterOptions !== 'undefined' && value) {
    const options: {
      [collection: string]: (string | number)[]
    } = {};

    const collections = typeof relationTo === 'string' ? [relationTo] : relationTo;
    const values = Array.isArray(value) ? value : [value];

    await Promise.all(collections.map(async (collection) => {
      const optionFilter = typeof filterOptions === 'function' ? filterOptions({
        id,
        data,
        siblingData,
        user,
        relationTo: collection,
      }) : filterOptions;

      const valueIDs: (string | number)[] = [];

      values.forEach((val) => {
        if (typeof val === 'object' && val?.value) {
          valueIDs.push(val.value);
        }

        if (typeof val === 'string' || typeof val === 'number') {
          valueIDs.push(val);
        }
      });

      const result = await payload.find<TypeWithID>({
        collection,
        depth: 0,
        where: {
          and: [
            { id: { in: valueIDs } },
            optionFilter,
          ],
        },
      });

      options[collection] = result.docs.map((doc) => doc.id);
    }));

    const invalidRelationships = values.filter((val) => {
      let collection: string;
      let requestedID: string | number;

      if (typeof relationTo === 'string') {
        collection = relationTo;

        if (typeof val === 'string' || typeof val === 'number') {
          requestedID = val;
        }
      }

      if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
        collection = val.relationTo;
        requestedID = val.value;
      }

      return options[collection].indexOf(requestedID) === -1;
    });

    if (invalidRelationships.length > 0) {
      return invalidRelationships.reduce((err, invalid, i) => {
        return `${err} ${JSON.stringify(invalid)}${invalidRelationships.length === i + 1 ? ',' : ''} `;
      }, i18n.t('validation:invalidSelections')) as string;
    }

    return true;
  }

  return true;
};

export const upload: Validate<unknown, unknown, UploadField> = (value: string, options) => {
  if (!value && options.required) {
    return options.i18n.t('validation:required');
  }

  if (!canUseDOM && typeof value !== 'undefined' && value !== null) {
    const idField = options.payload.collections[options.relationTo].config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');
    const type = getIDType(idField);

    if (!isValidID(value, type)) {
      return options.i18n.t('validation:validUploadID');
    }
  }

  return validateFilterOptions(value, options);
};

export const relationship: Validate<unknown, unknown, RelationshipField> = async (value: RelationshipValue, options) => {
  if ((!value || (Array.isArray(value) && value.length === 0)) && options.required) {
    return options.i18n.t('validation:required');
  }

  if (!canUseDOM && typeof value !== 'undefined' && value !== null) {
    const values = Array.isArray(value) ? value : [value];

    const invalidRelationships = values.filter((val) => {
      let collection: string;
      let requestedID: string | number;

      if (typeof options.relationTo === 'string') {
        collection = options.relationTo;

        // custom id
        if (typeof val === 'string' || typeof val === 'number') {
          requestedID = val;
        }
      }

      if (Array.isArray(options.relationTo) && typeof val === 'object' && val?.relationTo) {
        collection = val.relationTo;
        requestedID = val.value;
      }

      const idField = options.payload.collections[collection].config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');
      let type;
      if (idField) {
        type = idField.type === 'number' ? 'number' : 'text';
      } else {
        type = 'ObjectID';
      }

      return !isValidID(requestedID, type);
    });

    if (invalidRelationships.length > 0) {
      return `This field has the following invalid selections: ${invalidRelationships.map((err, invalid) => {
        return `${err} ${JSON.stringify(invalid)}`;
      }).join(', ')}` as string;
    }
  }

  return validateFilterOptions(value, options);
};

export const array: Validate<unknown, unknown, ArrayField> = (value, { i18n, minRows, maxRows, required }) => {
  if (minRows && value < minRows) {
    return i18n.t('validation:requiresAtLeast', { count: minRows, label: i18n.t('rows') });
  }

  if (maxRows && value > maxRows) {
    return i18n.t('validation:requiresNoMoreThan', { count: maxRows, label: i18n.t('rows') });
  }

  if (!value && required) {
    return i18n.t('validation:requiresAtLeast', { count: 1, label: i18n.t('row') });
  }

  return true;
};

export const select: Validate<unknown, unknown, SelectField> = (value, { i18n, options, hasMany, required }) => {
  if (Array.isArray(value) && value.some((input) => !options.some((option) => (option === input || (typeof option !== 'string' && option?.value === input))))) {
    return i18n.t('validation:invalidSelection');
  }

  if (typeof value === 'string' && !options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)))) {
    return i18n.t('validation:invalidSelection');
  }

  if (required && (
    (typeof value === 'undefined' || value === null) || (hasMany && Array.isArray(value) && (value as [])?.length === 0))
  ) {
    return i18n.t('validation:required');
  }

  return true;
};

export const radio: Validate<unknown, unknown, RadioField> = (value, { i18n, options, required }) => {
  const stringValue = String(value);
  if ((typeof value !== 'undefined' || !required) && (options.find((option) => String(typeof option !== 'string' && option?.value) === stringValue))) return true;
  return i18n.t('validation:required');
};

export const blocks: Validate<unknown, unknown, BlockField> = (value, { i18n, maxRows, minRows, required }) => {
  if (minRows && value < minRows) {
    return i18n.t('validation:requiresAtLeast', { count: minRows, label: i18n.t('rows') });
  }

  if (maxRows && value > maxRows) {
    return i18n.t('validation:requiresNoMoreThan', { count: maxRows, label: i18n.t('rows') });
  }

  if (!value && required) {
    return i18n.t('validation:requiresAtLeast', { count: 1, label: i18n.t('row') });
  }

  return true;
};

export const point: Validate<unknown, unknown, PointField> = (value: [number | string, number | string] = ['', ''], { i18n, required }) => {
  const lng = parseFloat(String(value[0]));
  const lat = parseFloat(String(value[1]));
  if (required && (
    (value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number')
    || (Number.isNaN(lng) || Number.isNaN(lat))
    || (Array.isArray(value) && value.length !== 2)
  )) {
    return i18n.t('validation:requiresTwoNumbers');
  }

  if ((value[1] && Number.isNaN(lng)) || (value[0] && Number.isNaN(lat))) {
    return i18n.t('validation:invalidInput');
  }

  return true;
};

export default {
  number,
  text,
  password,
  email,
  textarea,
  code,
  richText,
  checkbox,
  date,
  upload,
  relationship,
  array,
  select,
  radio,
  blocks,
  point,
};
