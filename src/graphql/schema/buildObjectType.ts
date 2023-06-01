/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
import { GraphQLJSON } from 'graphql-type-json';
import {
  GraphQLBoolean, GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import {
  Field,
  RadioField,
  RelationshipField,
  SelectField,
  UploadField,
  ArrayField,
  GroupField,
  RichTextField,
  NumberField,
  TextField,
  EmailField,
  TextareaField,
  CodeField,
  JSONField,
  DateField,
  PointField,
  CheckboxField,
  BlockField,
  RowField,
  CollapsibleField,
  TabsField,
  tabHasName,
} from '../../fields/config/types';
import formatName from '../utilities/formatName';
import combineParentName from '../utilities/combineParentName';
import withNullableType from './withNullableType';
import { toWords } from '../../utilities/formatLabels';
import createRichTextRelationshipPromise from '../../fields/richText/richTextRelationshipPromise';
import formatOptions from '../utilities/formatOptions';
import { Payload } from '../../payload';
import buildWhereInputType from './buildWhereInputType';
import buildBlockType from './buildBlockType';
import isFieldNullable from './isFieldNullable';

type LocaleInputType = {
  locale: {
    type: GraphQLType;
  },
  fallbackLocale: {
    type: GraphQLType;
  },
  where: {
    type: GraphQLType;
  }
}

export type ObjectTypeConfig = {
  [path: string]: GraphQLFieldConfig<any, any>
}

type Args = {
  payload: Payload
  name: string
  parentName: string
  fields: Field[]
  baseFields?: ObjectTypeConfig
  forceNullable?: boolean
}

function buildObjectType({
  payload,
  name,
  fields,
  parentName,
  baseFields = {},
  forceNullable,
}: Args): GraphQLObjectType {
  const fieldToSchemaMap = {
    number: (objectTypeConfig: ObjectTypeConfig, field: NumberField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLFloat, forceNullable) },
    }),
    text: (objectTypeConfig: ObjectTypeConfig, field: TextField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    email: (objectTypeConfig: ObjectTypeConfig, field: EmailField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, EmailAddressResolver, forceNullable) },
    }),
    textarea: (objectTypeConfig: ObjectTypeConfig, field: TextareaField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    code: (objectTypeConfig: ObjectTypeConfig, field: CodeField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    json: (objectTypeConfig: ObjectTypeConfig, field: JSONField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLJSON, forceNullable) },
    }),
    date: (objectTypeConfig: ObjectTypeConfig, field: DateField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, DateTimeResolver, forceNullable) },
    }),
    point: (objectTypeConfig: ObjectTypeConfig, field: PointField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, new GraphQLList(new GraphQLNonNull(GraphQLFloat)), forceNullable) },
    }),
    richText: (objectTypeConfig: ObjectTypeConfig, field: RichTextField) => ({
      ...objectTypeConfig,
      [field.name]: {
        type: withNullableType(field, GraphQLJSON, forceNullable),
        async resolve(parent, args, context) {
          let depth = payload.config.defaultDepth;
          if (typeof args.depth !== 'undefined') depth = args.depth;

          if (depth > 0) {
            await createRichTextRelationshipPromise({
              req: context.req,
              siblingDoc: parent,
              depth,
              field,
              showHiddenFields: false,
            });
          }

          return parent[field.name];
        },
        args: {
          depth: {
            type: GraphQLInt,
          },
        },
      },
    }),
    upload: (objectTypeConfig: ObjectTypeConfig, field: UploadField) => {
      const { relationTo } = field;

      const uploadName = combineParentName(parentName, toWords(field.name, true));

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      const type = withNullableType(
        field,
        payload.collections[relationTo].graphQL.type || newlyCreatedBlockType,
        forceNullable,
      );

      const uploadArgs = {} as LocaleInputType;

      if (payload.config.localization) {
        uploadArgs.locale = {
          type: payload.types.localeInputType,
        };

        uploadArgs.fallbackLocale = {
          type: payload.types.fallbackLocaleInputType,
        };
      }

      const relatedCollectionSlug = field.relationTo;

      const upload = {
        args: uploadArgs,
        type,
        extensions: { complexity: 20 },
        async resolve(parent, args, context) {
          const value = parent[field.name];
          const locale = args.locale || context.req.locale;
          const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale;
          const id = value;

          if (id) {
            const relatedDocument = await context.req.payloadDataLoader.load(JSON.stringify([
              relatedCollectionSlug,
              id,
              0,
              0,
              locale,
              fallbackLocale,
              false,
              false,
            ]));

            return relatedDocument || null;
          }

          return null;
        },
      };

      const whereFields = payload.collections[relationTo].config.fields;

      upload.args.where = {
        type: buildWhereInputType(
          uploadName,
          whereFields,
          uploadName,
        ),
      };

      return {
        ...objectTypeConfig,
        [field.name]: upload,
      };
    },
    radio: (objectTypeConfig: ObjectTypeConfig, field: RadioField) => ({
      ...objectTypeConfig,
      [field.name]: {
        type: withNullableType(
          field,
          new GraphQLEnumType({
            name: combineParentName(parentName, field.name),
            values: formatOptions(field),
          }),
          forceNullable,
        ),
      },
    }),
    checkbox: (objectTypeConfig: ObjectTypeConfig, field: CheckboxField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLBoolean, forceNullable) },
    }),
    select: (objectTypeConfig: ObjectTypeConfig, field: SelectField) => {
      const fullName = combineParentName(parentName, field.name);

      let type: GraphQLType = new GraphQLEnumType({
        name: fullName,
        values: formatOptions(field),
      });

      type = field.hasMany ? new GraphQLList(new GraphQLNonNull(type)) : type;
      type = withNullableType(field, type, forceNullable);

      return {
        ...objectTypeConfig,
        [field.name]: { type },
      };
    },
    relationship: (objectTypeConfig: ObjectTypeConfig, field: RelationshipField) => {
      const { relationTo } = field;
      const isRelatedToManyCollections = Array.isArray(relationTo);
      const hasManyValues = field.hasMany;
      const relationshipName = combineParentName(parentName, toWords(field.name, true));

      let type;
      let relationToType = null;

      if (Array.isArray(relationTo)) {
        relationToType = new GraphQLEnumType({
          name: `${relationshipName}_RelationTo`,
          values: relationTo.reduce((relations, relation) => ({
            ...relations,
            [formatName(relation)]: {
              value: relation,
            },
          }), {}),
        });

        const types = relationTo.map((relation) => payload.collections[relation].graphQL.type);

        type = new GraphQLObjectType({
          name: `${relationshipName}_Relationship`,
          fields: {
            relationTo: {
              type: relationToType,
            },
            value: {
              type: new GraphQLUnionType({
                name: relationshipName,
                types,
                async resolveType(data, { req }) {
                  return payload.collections[data.collection].graphQL.type.name;
                },
              }),
            },
          },
        });
      } else {
        ({ type } = payload.collections[relationTo as string].graphQL);
      }

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      type = type || newlyCreatedBlockType;

      const relationshipArgs: {
        locale?: unknown
        fallbackLocale?: unknown
        where?: unknown
        page?: unknown
        limit?: unknown
      } = {};

      if (payload.config.localization) {
        relationshipArgs.locale = {
          type: payload.types.localeInputType,
        };

        relationshipArgs.fallbackLocale = {
          type: payload.types.fallbackLocaleInputType,
        };
      }

      const relationship = {
        args: relationshipArgs,
        type: withNullableType(
          field,
          hasManyValues ? new GraphQLList(new GraphQLNonNull(type)) : type,
          forceNullable,
        ),
        extensions: { complexity: 10 },
        async resolve(parent, args, context) {
          const value = parent[field.name];
          const locale = args.locale || context.req.locale;
          const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale;
          let relatedCollectionSlug = field.relationTo;

          if (hasManyValues) {
            const results = [];
            const resultPromises = [];

            const createPopulationPromise = async (relatedDoc, i) => {
              let id = relatedDoc;
              let collectionSlug = field.relationTo;

              if (isRelatedToManyCollections) {
                collectionSlug = relatedDoc.relationTo;
                id = relatedDoc.value;
              }

              const result = await context.req.payloadDataLoader.load(JSON.stringify([
                collectionSlug,
                id,
                0,
                0,
                locale,
                fallbackLocale,
                false,
                false,
              ]));

              if (result) {
                if (isRelatedToManyCollections) {
                  results[i] = {
                    relationTo: collectionSlug,
                    value: {
                      ...result,
                      collection: collectionSlug,
                    },
                  };
                } else {
                  results[i] = result;
                }
              }
            };

            if (value) {
              value.forEach((relatedDoc, i) => {
                resultPromises.push(createPopulationPromise(relatedDoc, i));
              });
            }

            await Promise.all(resultPromises);
            return results;
          }

          let id = value;
          if (isRelatedToManyCollections && value) {
            id = value.value;
            relatedCollectionSlug = value.relationTo;
          }

          if (id) {
            const relatedDocument = await context.req.payloadDataLoader.load(JSON.stringify([
              relatedCollectionSlug,
              id,
              0,
              0,
              locale,
              fallbackLocale,
              false,
              false,
            ]));

            if (relatedDocument) {
              if (isRelatedToManyCollections) {
                return {
                  relationTo: relatedCollectionSlug,
                  value: {
                    ...relatedDocument,
                    collection: relatedCollectionSlug,
                  },
                };
              }

              return relatedDocument;
            }

            return null;
          }

          return null;
        },
      };

      return {
        ...objectTypeConfig,
        [field.name]: relationship,
      };
    },
    array: (objectTypeConfig: ObjectTypeConfig, field: ArrayField) => {
      const fullName = combineParentName(parentName, toWords(field.name, true));

      const type = buildObjectType({
        payload,
        name: fullName,
        fields: field.fields,
        parentName: fullName,
        forceNullable: isFieldNullable(field, forceNullable),
      });

      const arrayType = new GraphQLList(new GraphQLNonNull(type));

      return {
        ...objectTypeConfig,
        [field.name]: { type: withNullableType(field, arrayType) },
      };
    },
    group: (objectTypeConfig: ObjectTypeConfig, field: GroupField) => {
      const fullName = combineParentName(parentName, toWords(field.name, true));
      const type = buildObjectType({
        payload,
        name: fullName,
        parentName: fullName,
        fields: field.fields,
        forceNullable: isFieldNullable(field, forceNullable),
      });

      return {
        ...objectTypeConfig,
        [field.name]: { type },
      };
    },
    blocks: (objectTypeConfig: ObjectTypeConfig, field: BlockField) => {
      const blockTypes = field.blocks.map((block) => {
        buildBlockType({
          payload,
          block,
          forceNullable: isFieldNullable(field, forceNullable),
        });
        return payload.types.blockTypes[block.slug];
      });

      const fullName = combineParentName(parentName, toWords(field.name, true));

      const type = new GraphQLList(new GraphQLNonNull(new GraphQLUnionType({
        name: fullName,
        types: blockTypes,
        resolveType: (data) => payload.types.blockTypes[data.blockType].name,
      })));

      return {
        ...objectTypeConfig,
        [field.name]: { type: withNullableType(field, type) },
      };
    },
    row: (objectTypeConfig: ObjectTypeConfig, field: RowField) => field.fields.reduce((objectTypeConfigWithRowFields, subField) => {
      const addSubField = fieldToSchemaMap[subField.type];
      if (addSubField) return addSubField(objectTypeConfigWithRowFields, subField);
      return objectTypeConfigWithRowFields;
    }, objectTypeConfig),
    collapsible: (objectTypeConfig: ObjectTypeConfig, field: CollapsibleField) => field.fields.reduce((objectTypeConfigWithCollapsibleFields, subField) => {
      const addSubField = fieldToSchemaMap[subField.type];
      if (addSubField) return addSubField(objectTypeConfigWithCollapsibleFields, subField);
      return objectTypeConfigWithCollapsibleFields;
    }, objectTypeConfig),
    tabs: (objectTypeConfig: ObjectTypeConfig, field: TabsField) => field.tabs.reduce((tabSchema, tab) => {
      if (tabHasName(tab)) {
        const fullName = combineParentName(parentName, toWords(tab.name, true));
        const type = buildObjectType({
          payload,
          name: fullName,
          parentName: fullName,
          fields: tab.fields,
          forceNullable,
        });

        return {
          ...tabSchema,
          [tab.name]: { type },
        };
      }

      return {
        ...tabSchema,
        ...tab.fields.reduce((subFieldSchema, subField) => {
          const addSubField = fieldToSchemaMap[subField.type];
          if (addSubField) return addSubField(subFieldSchema, subField);
          return subFieldSchema;
        }, tabSchema),
      };
    }, objectTypeConfig),
  };

  const objectSchema = {
    name,
    fields: () => fields.reduce((objectTypeConfig, field) => {
      const fieldSchema = fieldToSchemaMap[field.type];

      if (typeof fieldSchema !== 'function') {
        return objectTypeConfig;
      }

      return {
        ...objectTypeConfig,
        ...fieldSchema(objectTypeConfig, field),
      };
    }, baseFields),
  };

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema);

  return newlyCreatedBlockType;
}

export default buildObjectType;
