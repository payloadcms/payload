/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
import { GraphQLJSON } from 'graphql-type-json';
import {
  GraphQLBoolean, GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import { Field, RadioField, RelationshipField, SelectField, UploadField, ArrayField, GroupField, RichTextField, fieldAffectsData, NumberField, TextField, EmailField, TextareaField, CodeField, DateField, PointField, CheckboxField, BlockField, RowField, fieldIsPresentationalOnly } from '../../fields/config/types';
import formatName from '../utilities/formatName';
import combineParentName from '../utilities/combineParentName';
import withNullableType from './withNullableType';
import { BaseFields } from '../../collections/graphql/types';
import { toWords } from '../../utilities/formatLabels';
import createRichTextRelationshipPromise from '../../fields/richText/relationshipPromise';
import formatOptions from '../utilities/formatOptions';
import { Payload } from '../..';
import find from '../../collections/operations/find';
import buildWhereInputType from './buildWhereInputType';
import buildBlockType from './buildBlockType';

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

function buildObjectType(payload: Payload, name: string, fields: Field[], parentName: string, baseFields: BaseFields = {}): GraphQLObjectType {
  const fieldToSchemaMap = {
    number: (field: NumberField) => ({ type: withNullableType(field, GraphQLFloat) }),
    text: (field: TextField) => ({ type: withNullableType(field, GraphQLString) }),
    email: (field: EmailField) => ({ type: withNullableType(field, EmailAddressResolver) }),
    textarea: (field: TextareaField) => ({ type: withNullableType(field, GraphQLString) }),
    code: (field: CodeField) => ({ type: withNullableType(field, GraphQLString) }),
    date: (field: DateField) => ({ type: withNullableType(field, DateTimeResolver) }),
    point: (field: PointField) => ({ type: withNullableType(field, new GraphQLList(GraphQLFloat)) }),
    richText: (field: RichTextField) => ({
      type: withNullableType(field, GraphQLJSON),
      async resolve(parent, args, context) {
        if (args.depth > 0) {
          await createRichTextRelationshipPromise({
            req: context.req,
            siblingDoc: parent,
            depth: args.depth,
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
    }),
    upload: (field: UploadField) => {
      const { relationTo, label } = field;

      const uploadName = combineParentName(parentName, label === false ? toWords(field.name, true) : label);

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      const type = payload.collections[relationTo].graphQL.type || newlyCreatedBlockType;

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
      const relatedCollection = payload.collections[relatedCollectionSlug];

      const upload = {
        args: uploadArgs,
        type,
        extensions: { complexity: 20 },
        async resolve(parent, args, context) {
          const value = parent[field.name];
          const locale = args.locale || context.req.locale;
          const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale;

          let id = value;

          if (id) {
            id = id.toString();

            const relatedDocumentQuery = {
              collection: relatedCollection,
              where: {
                ...(args.where || {}),
                _id: {
                  equals: id,
                },
              },
              res: context.res,
              req: {
                ...context.req,
                locale,
                fallbackLocale,
              },
              depth: 0,
              pagination: false,
            };

            const relatedDocument = await find(relatedDocumentQuery);

            if (relatedDocument.docs[0]) return relatedDocument.docs[0];

            return null;
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

      return upload;
    },
    radio: (field: RadioField) => ({
      type: withNullableType(
        field,
        new GraphQLEnumType({
          name: combineParentName(parentName, field.name),
          values: formatOptions(field),
        }),
      ),
    }),
    checkbox: (field: CheckboxField) => ({ type: withNullableType(field, GraphQLBoolean) }),
    select: (field: SelectField) => {
      const fullName = combineParentName(parentName, field.name);

      let type: GraphQLType = new GraphQLEnumType({
        name: fullName,
        values: formatOptions(field),
      });

      type = field.hasMany ? new GraphQLList(type) : type;
      type = withNullableType(field, type);

      return { type };
    },
    relationship: (field: RelationshipField) => {
      const { relationTo, label } = field;
      const isRelatedToManyCollections = Array.isArray(relationTo);
      const hasManyValues = field.hasMany;
      const relationshipName = combineParentName(parentName, label === false ? toWords(field.name, true) : label);

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

      const {
        collections,
      } = payload;

      const relationship = {
        args: relationshipArgs,
        type: hasManyValues ? new GraphQLList(type) : type,
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

              const result = await find({
                collection: collections[collectionSlug as string],
                where: {
                  ...(args.where || {}),
                  _id: {
                    equals: id,
                  },
                },
                req: {
                  ...context.req,
                  locale,
                  fallbackLocale,
                },
                depth: 0,
                pagination: false,
              });

              if (result.docs.length === 1) {
                if (isRelatedToManyCollections) {
                  results[i] = {
                    relationTo: collectionSlug,
                    value: {
                      ...result.docs[0],
                      collection: collectionSlug,
                    },
                  };
                } else {
                  [results[i]] = result.docs;
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
            id = id.toString();

            const relatedDocumentQuery = {
              collection: collections[relatedCollectionSlug as string],
              where: {
                ...(args.where || {}),
                id: {
                  equals: id,
                },
              },
              ...context,
              depth: 0,
            };

            if (args.page) relatedDocumentQuery.paginate.page = args.page;
            if (args.limit) relatedDocumentQuery.paginate.limit = args.limit;

            const relatedDocument = await find(relatedDocumentQuery);

            if (relatedDocument.docs[0]) {
              if (isRelatedToManyCollections) {
                return {
                  relationTo: relatedCollectionSlug,
                  value: {
                    ...relatedDocument.docs[0],
                    collection: relatedCollectionSlug,
                  },
                };
              }

              return relatedDocument.docs[0];
            }

            return null;
          }

          return null;
        },
      };

      if (hasManyValues) {
        relationship.args.page = { type: GraphQLInt };
        relationship.args.limit = { type: GraphQLInt };
      }

      if (Array.isArray(relationTo)) {
        const relatedCollectionFields = relationTo.reduce((allFields, relation) => [
          ...allFields,
          ...collections[relation].config.fields,
        ], []);

        relationship.args.where = {
          type: buildWhereInputType(
            relationshipName,
            relatedCollectionFields,
            relationshipName,
          ),
        };
      } else {
        const whereFields = payload.collections[relationTo].config.fields;

        relationship.args.where = {
          type: buildWhereInputType(
            relationshipName,
            whereFields,
            relationshipName,
          ),
        };
      }

      return relationship;
    },
    array: (field: ArrayField) => {
      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);
      const type = buildObjectType(payload, fullName, field.fields, fullName);
      const arrayType = new GraphQLList(withNullableType(field, type));

      return { type: arrayType };
    },
    group: (field: GroupField) => {
      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);
      const type = buildObjectType(payload, fullName, field.fields, fullName);

      return { type };
    },
    blocks: (field: BlockField) => {
      const blockTypes = field.blocks.map((block) => {
        buildBlockType(payload, block);
        return payload.types.blockTypes[block.slug];
      });

      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);

      const type = new GraphQLList(new GraphQLUnionType({
        name: fullName,
        types: blockTypes,
        resolveType: (data) => payload.types.blockTypes[data.blockType].name,
      }));

      return { type };
    },
    row: (field) => field.fields.reduce((subFieldSchema, subField) => {
      const buildSchemaType = fieldToSchemaMap[subField.type];

      if (!fieldIsPresentationalOnly(subField) && buildSchemaType) {
        return {
          ...subFieldSchema,
          [formatName(subField.name)]: buildSchemaType(subField),
        };
      }

      return subFieldSchema;
    }, {}),
  };

  const objectSchema = {
    name,
    fields: () => fields.reduce((schema, field) => {
      if (!fieldIsPresentationalOnly(field) && !field.hidden) {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) {
          if (fieldAffectsData(field)) {
            return {
              ...schema,
              [formatName(field.name)]: fieldSchema(field),
            };
          }

          return {
            ...schema,
            ...fieldSchema(field),
          };
        }
      }

      return schema;
    }, baseFields),
  };

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema);

  return newlyCreatedBlockType;
}

export default buildObjectType;
