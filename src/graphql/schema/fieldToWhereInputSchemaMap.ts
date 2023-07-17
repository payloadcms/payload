import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLString,
} from 'graphql';
import {
  ArrayField,
  CheckboxField,
  CodeField, CollapsibleField, DateField,
  EmailField, fieldAffectsData, fieldHasSubFields, GroupField,
  JSONField,
  NumberField, PointField,
  RadioField, RelationshipField,
  RichTextField, RowField, SelectField,
  TabsField,
  TextareaField,
  TextField, UploadField,
} from '../../fields/config/types';
import { withOperators } from './withOperators';
import combineParentName from '../utilities/combineParentName';
import formatName from '../utilities/formatName';
import recursivelyBuildNestedPaths from './recursivelyBuildNestedPaths';

const fieldToSchemaMap = (parentName: string, nestedFieldName?: string): any => ({
  number: (field: NumberField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  text: (field: TextField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  email: (field: EmailField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  textarea: (field: TextareaField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  richText: (field: RichTextField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  json: (field: JSONField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  code: (field: CodeField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  radio: (field: RadioField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  date: (field: DateField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  point: (field: PointField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  relationship: (field: RelationshipField) => {
    if (Array.isArray(field.relationTo)) {
      return {
        type: new GraphQLInputObjectType({
          name: `${combineParentName(parentName, field.name)}_Relation`,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
                values: field.relationTo.reduce((values, relation) => ({
                  ...values,
                  [formatName(relation)]: {
                    value: relation,
                  },
                }), {}),
              }),
            },
            value: { type: GraphQLString },
          },
        }),
      };
    }

    return {
      type: withOperators(
        field,
        parentName,
      ),
    };
  },
  upload: (field: UploadField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  checkbox: (field: CheckboxField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  select: (field: SelectField) => ({
    type: withOperators(
      field,
      parentName,
    ),
  }),
  array: (field: ArrayField) => recursivelyBuildNestedPaths(parentName, nestedFieldName, field),
  group: (field: GroupField) => recursivelyBuildNestedPaths(parentName, nestedFieldName, field),
  row: (field: RowField) => recursivelyBuildNestedPaths(parentName, nestedFieldName, field),
  collapsible: (field: CollapsibleField) => recursivelyBuildNestedPaths(parentName, nestedFieldName, field),
  tabs: (field: TabsField) => recursivelyBuildNestedPaths(parentName, nestedFieldName, field),
});

export default fieldToSchemaMap;
