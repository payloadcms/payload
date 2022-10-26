import { RelationshipField } from 'payload/dist/fields/config/types';
import { Field } from 'payload/types';

const createParentField = (relationTo: string, overrides?: Partial<RelationshipField>): Field => ({
  name: 'parent',
  relationTo,
  type: 'relationship',
  maxDepth: 1,
  filterOptions: ({id}) => ({id: {not_equals: id}}),
  admin: {
    position: 'sidebar',
    ...overrides?.admin || {},
  },
  ...overrides || {}
});

export default createParentField;
