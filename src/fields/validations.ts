import defaultRichTextValue from './richText/defaultValue';
import {
  ArrayField,
  BlockField,
  CheckboxField,
  CodeField,
  DateField,
  EmailField,
  fieldAffectsData,
  JSONField,
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
} from './config/types';
import canUseDOM from '../utilities/canUseDOM';
import { isValidID } from '../utilities/isValidID';
import { getIDType } from '../utilities/getIDType';

export const number: Validate<unknown, unknown, NumberField> = (value: string, { t, required, min, max }) => {
  const parsedValue = parseFloat(value);

  if ((value && typeof parsedValue !== 'number') || (required && Number.isNaN(parsedValue)) || (value && Number.isNaN(parsedValue))) {
    return t('validation:enterNumber');
  }

  if (typeof max === 'number' && parsedValue > max) {
    return t('validation:greaterThanMax', { value, max });
  }

  if (typeof min === 'number' && parsedValue < min) {
    return t('validation:lessThanMin', { value, min });
  }

  if (required && typeof parsedValue !== 'number') {
    return t('validation:required');
  }

  return true;
};

export const text: Validate<unknown, unknown, TextField> = (value: string, { t, minLength, maxLength: fieldMaxLength, required, payload }) => {
  let maxLength: number;

  if (typeof payload?.config?.defaultMaxTextLength === 'number') maxLength = payload.config.defaultMaxTextLength;
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
  if (value && maxLength && value.length > maxLength) {
    return t('validation:shorterThanMax', { maxLength });
  }

  if (value && minLength && value?.length < minLength) {
    return t('validation:longerThanMin', { minLength });
  }

  if (required) {
    if (typeof value !== 'string' || value?.length === 0) {
      return t('validation:required');
    }
  }

  return true;
};

export const password: Validate<unknown, unknown, TextField> = (value: string, { t, required, maxLength: fieldMaxLength, minLength, payload }) => {
  let maxLength: number;

  if (typeof payload?.config?.defaultMaxTextLength === 'number') maxLength = payload.config.defaultMaxTextLength;
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;

  if (value && maxLength && value.length > maxLength) {
    return t('validation:shorterThanMax', { maxLength });
  }

  if (value && minLength && value.length < minLength) {
    return t('validation:longerThanMin', { minLength });
  }

  if (required && !value) {
    return t('validation:required');
  }

  return true;
};

export const email: Validate<unknown, unknown, EmailField> = (value: string, { t, required }) => {
  if ((value && !/\S+@\S+\.\S+/.test(value))
    || (!value && required)) {
    return t('validation:emailAddress');
  }

  return true;
};

export const textarea: Validate<unknown, unknown, TextareaField> = (value: string, {
  t,
  required,
  maxLength: fieldMaxLength,
  minLength,
  payload,
}) => {
  let maxLength: number;

  if (typeof payload?.config?.defaultMaxTextLength === 'number') maxLength = payload.config.defaultMaxTextLength;
  if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
  if (value && maxLength && value.length > maxLength) {
    return t('validation:shorterThanMax', { maxLength });
  }

  if (value && minLength && value.length < minLength) {
    return t('validation:longerThanMin', { minLength });
  }

  if (required && !value) {
    return t('validation:required');
  }

  return true;
};

export const code: Validate<unknown, unknown, CodeField> = (value: string, { t, required }) => {
  if (required && value === undefined) {
    return t('validation:required');
  }

  return true;
};

export const json: Validate<unknown, unknown, JSONField & { jsonError?: string }> = (value: string, {
  t, required, jsonError,
}) => {
  if (required && !value) {
    return t('validation:required');
  }

  if (jsonError !== undefined) {
    return t('validation:invalidInput');
  }

  return true;
};

export const richText: Validate<unknown, unknown, RichTextField> = (value, { t, required }) => {
  if (required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue);
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true;
    return t('validation:required');
  }

  return true;
};

export const checkbox: Validate<unknown, unknown, CheckboxField> = (value: boolean, { t, required }) => {
  if ((value && typeof value !== 'boolean')
    || (required && typeof value !== 'boolean')) {
    return t('validation:trueOrFalse');
  }

  return true;
};

export const date: Validate<unknown, unknown, DateField> = (value, { t, required }) => {
  if (value && !isNaN(Date.parse(value.toString()))) { /* eslint-disable-line */
    return true;
  }

  if (value) {
    return t('validation:notValidDate', { value });
  }

  if (required) {
    return t('validation:required');
  }

  return true;
};

const validateFilterOptions: Validate = async (value, { t, filterOptions, id, user, data, siblingData, relationTo, payload }) => {
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

      const result = await payload.find({
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
      }, t('validation:invalidSelections')) as string;
    }

    return true;
  }

  return true;
};

export const upload: Validate<unknown, unknown, UploadField> = (value: string, options) => {
  if (!value && options.required) {
    return options.t('validation:required');
  }

  if (!canUseDOM && typeof value !== 'undefined' && value !== null) {
    const idField = options.payload.collections[options.relationTo].config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');
    const type = getIDType(idField);

    if (!isValidID(value, type)) {
      return options.t('validation:validUploadID');
    }
  }

  return validateFilterOptions(value, options);
};

export const relationship: Validate<unknown, unknown, RelationshipField> = async (value: RelationshipValue, options) => {
  const {
    required,
    min,
    max,
    relationTo,
    payload,
    t,
  } = options;

  if ((!value || (Array.isArray(value) && value.length === 0)) && required) {
    return options.t('validation:required');
  }

  if (Array.isArray(value)) {
    if (min && value.length < min) {
      return t('validation:lessThanMin', { count: min, label: t('rows') });
    }

    if (max && value.length > max) {
      return t('validation:greaterThanMax', { count: max, label: t('rows') });
    }
  }

  if (!canUseDOM && typeof value !== 'undefined' && value !== null) {
    const values = Array.isArray(value) ? value : [value];

    const invalidRelationships = values.filter((val) => {
      let collection: string;
      let requestedID;

      if (typeof relationTo === 'string') {
        collection = relationTo;

        // custom id
        if (val) {
          requestedID = val;
        }
      }

      if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
        collection = val.relationTo;
        requestedID = val.value;
      }

      if (requestedID === null) return false;

      const idField = payload.collections[collection]?.config?.fields?.find((field) => fieldAffectsData(field) && field.name === 'id');
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

export const array: Validate<unknown, unknown, ArrayField> = (value, { t, minRows, maxRows, required }) => {
  if (minRows && value < minRows) {
    return t('validation:requiresAtLeast', { count: minRows, label: t('rows') });
  }

  if (maxRows && value > maxRows) {
    return t('validation:requiresNoMoreThan', { count: maxRows, label: t('rows') });
  }

  if (!value && required) {
    return t('validation:requiresAtLeast', { count: 1, label: t('row') });
  }

  return true;
};

export const select: Validate<unknown, unknown, SelectField> = (value, { t, options, hasMany, required }) => {
  if (Array.isArray(value) && value.some((input) => !options.some((option) => (option === input || (typeof option !== 'string' && option?.value === input))))) {
    return t('validation:invalidSelection');
  }

  if (typeof value === 'string' && !options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)))) {
    return t('validation:invalidSelection');
  }

  if (required && (
    (typeof value === 'undefined' || value === null) || (hasMany && Array.isArray(value) && (value as [])?.length === 0))
  ) {
    return t('validation:required');
  }

  return true;
};

export const radio: Validate<unknown, unknown, RadioField> = (value, { t, options, required }) => {
  if (value) {
    const valueMatchesOption = options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)));
    return valueMatchesOption || t('validation:invalidSelection');
  }

  return required ? t('validation:required') : true;
};

export const blocks: Validate<unknown, unknown, BlockField> = (value, { t, maxRows, minRows, required }) => {
  if (minRows && value < minRows) {
    return t('validation:requiresAtLeast', { count: minRows, label: t('rows') });
  }

  if (maxRows && value > maxRows) {
    return t('validation:requiresNoMoreThan', { count: maxRows, label: t('rows') });
  }

  if (!value && required) {
    return t('validation:requiresAtLeast', { count: 1, label: t('row') });
  }

  return true;
};

export const point: Validate<unknown, unknown, PointField> = (value: [number | string, number | string] = ['', ''], { t, required }) => {
  const lng = parseFloat(String(value[0]));
  const lat = parseFloat(String(value[1]));
  if (required && (
    (value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number')
    || (Number.isNaN(lng) || Number.isNaN(lat))
    || (Array.isArray(value) && value.length !== 2)
  )) {
    return t('validation:requiresTwoNumbers');
  }

  if ((value[1] && Number.isNaN(lng)) || (value[0] && Number.isNaN(lat))) {
    return t('validation:invalidInput');
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
  json,
};
