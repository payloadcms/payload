import { formatLabels, toWords } from '../../utilities/formatLabels';
import { MissingFieldType, InvalidFieldRelationship } from '../../errors';
import validations from '../validations';

const sanitizeFields = (fields, validRelationships: string[]) => {
  if (!fields) return [];

  return fields.map((unsanitizedField) => {
    const field = { ...unsanitizedField };

    if (!field.type) throw new MissingFieldType(field);

    // Auto-label
    if (field.name && typeof field.label !== 'string' && field.label !== false) {
      field.label = toWords(field.name);
    }

    if (field.type === 'relationship') {
      const relationships = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo];
      relationships.forEach((relationship: string) => {
        if (!validRelationships.includes(relationship)) {
          throw new InvalidFieldRelationship(field, relationship);
        }
      });
    }

    if (field.type === 'blocks') {
      field.labels = field.labels || formatLabels(field.name);
    }

    if (typeof field.validate === 'undefined') {
      const defaultValidate = validations[field.type];
      if (defaultValidate) {
        field.validate = (val) => defaultValidate(val, field);
      } else {
        field.validate = () => true;
      }
    }

    if (!field.hooks) field.hooks = {};
    if (!field.access) field.access = {};
    if (!field.admin) field.admin = {};

    if (field.fields) field.fields = sanitizeFields(field.fields, validRelationships);

    if (field.blocks) {
      field.blocks = field.blocks.map((block) => {
        const unsanitizedBlock = { ...block };
        unsanitizedBlock.labels = !unsanitizedBlock.labels ? formatLabels(unsanitizedBlock.slug) : unsanitizedBlock.labels;
        unsanitizedBlock.fields = sanitizeFields(block.fields, validRelationships);
        return unsanitizedBlock;
      });
    }

    return field;
  });
};

export default sanitizeFields;
