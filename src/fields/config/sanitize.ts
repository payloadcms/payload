import { formatLabels, toWords } from '../../utilities/formatLabels';
import { MissingFieldType, InvalidFieldRelationship, InvalidFieldName } from '../../errors';
import { baseBlockFields } from '../baseFields/baseBlockFields';
import validations from '../validations';
import { baseIDField } from '../baseFields/baseIDField';
import { Field, fieldAffectsData } from './types';
import withCondition from '../../admin/components/forms/withCondition';
import { Config } from '../../config/types';
import { CollectionConfig } from '../../collections/config/types';
import { GlobalConfig } from '../../globals/config/types';
import afterDeleteCascadeHook from '../afterDeleteCascadeHook';

const sanitizeFields = (fields: Field[], config: Config, collection: CollectionConfig | GlobalConfig, path = ''): Field[] => {
  if (!fields) return [];

  return fields.map((unsanitizedField) => {
    const field: Field = { ...unsanitizedField };

    if (!field.type) throw new MissingFieldType(field);

    // assert that field names do not contain forbidden characters
    if ('name' in field && field.name && field.name.includes('.')) {
      throw new InvalidFieldName(field, field.name);
    }

    // Auto-label
    if ('name' in field && field.name && typeof field.label !== 'string' && field.label !== false) {
      field.label = toWords(field.name);
    }

    if (field.type === 'checkbox' && typeof field.defaultValue === 'undefined' && field.required === true) {
      field.defaultValue = false;
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      const relationships = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo];
      relationships.forEach((relationship: string) => {
        const relatedCollection = config.collections.find((c) => c.slug === relationship);
        if (!relatedCollection) {
          throw new InvalidFieldRelationship(field, relationship);
        }
        if (field.cascade) {
          const afterDelete = [
            ...relatedCollection?.hooks?.afterDelete ?? [],
            afterDeleteCascadeHook(field, collection, path),
          ];
          relatedCollection.hooks = {
            ...relatedCollection.hooks,
            afterDelete,
          };
        }
      });
    }

    if (field.type === 'blocks' && field.blocks) {
      field.blocks = field.blocks.map((block) => ({ ...block, fields: block.fields.concat(baseBlockFields) }));
    }

    if (field.type === 'array' && field.fields) {
      field.fields.push(baseIDField);
    }

    if ((field.type === 'blocks' || field.type === 'array') && field.label !== false) {
      field.labels = field.labels || formatLabels(field.name);
    }

    if (fieldAffectsData(field)) {
      if (typeof field.validate === 'undefined') {
        const defaultValidate = validations[field.type];
        if (defaultValidate) {
          field.validate = (val, options) => defaultValidate(val, { ...field, ...options });
        } else {
          field.validate = () => true;
        }
      }

      if (!field.hooks) field.hooks = {};
      if (!field.access) field.access = {};
    }

    if (field.admin) {
      if (field.admin.condition && field.admin.components?.Field) {
        field.admin.components.Field = withCondition(field.admin.components?.Field);
      }
    } else {
      field.admin = {};
    }

    if ('fields' in field && field.fields) {
      const fieldPath = `${path ? `${path}.` : ''}${'name' in field ? field.name : ''}`;
      field.fields = sanitizeFields(field.fields, config, collection, fieldPath);
    }

    if (field.type === 'tabs') {
      field.tabs = field.tabs.map((tab) => {
        const unsanitizedTab = { ...tab };
        const fieldPath = `${path ? `${path}.` : ''}${'name' in tab ? tab.name : ''}`;
        unsanitizedTab.fields = sanitizeFields(tab.fields, config, collection, fieldPath);
        return unsanitizedTab;
      });
    }

    if ('blocks' in field && field.blocks) {
      field.blocks = field.blocks.map((block) => {
        const unsanitizedBlock = { ...block };
        const fieldPath = `${path ? `${path}.` : ''}${'name' in field ? field.name : ''}`;
        unsanitizedBlock.labels = !unsanitizedBlock.labels ? formatLabels(unsanitizedBlock.slug) : unsanitizedBlock.labels;
        unsanitizedBlock.fields = sanitizeFields(block.fields, config, collection, fieldPath);
        return unsanitizedBlock;
      });
    }

    return field;
  });
};

export default sanitizeFields;
