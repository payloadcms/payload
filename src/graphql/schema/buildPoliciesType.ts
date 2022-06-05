
import { GraphQLJSONObject } from 'graphql-type-json';
import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import formatName from '../utilities/formatName';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { SanitizedGlobalConfig } from '../../globals/config/types';
import { Field } from '../../fields/config/types';
import { Payload } from '../..';

type OperationType = 'create' | 'read' | 'update' | 'delete' | 'unlock' | 'readVersions';

type ObjectTypeFields = {
  [key in OperationType | 'fields']?: { type: GraphQLObjectType };
}

const buildFields = (label, fieldsToBuild) => fieldsToBuild.reduce((builtFields, field) => {
  if (!field.hidden) {
    if (field.name) {
      const fieldName = formatName(field.name);

      const objectTypeFields: ObjectTypeFields = ['create', 'read', 'update', 'delete'].reduce((operations, operation) => {
        const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

        return {
          ...operations,
          [operation]: {
            type: new GraphQLObjectType({
              name: `${label}_${fieldName}_${capitalizedOperation}`,
              fields: {
                permission: {
                  type: new GraphQLNonNull(GraphQLBoolean),
                },
              },
            }),
          },
        };
      }, {});

      if (field.fields) {
        objectTypeFields.fields = {
          type: new GraphQLObjectType({
            name: `${label}_${fieldName}_Fields`,
            fields: buildFields(`${label}_${fieldName}`, field.fields),
          }),
        };
      }

      return {
        ...builtFields,
        [field.name]: {
          type: new GraphQLObjectType({
            name: `${label}_${fieldName}`,
            fields: objectTypeFields,
          }),
        },
      };
    }

    if (!field.name && field.fields) {
      const subFields = buildFields(label, field.fields);

      return {
        ...builtFields,
        ...subFields,
      };
    }
  }
  return builtFields;
}, {});

const buildEntity = (label: string, entityFields: Field[], operations: OperationType[]) => {
  const formattedLabel = formatName(label);

  const fields = {
    fields: {
      type: new GraphQLObjectType({
        name: formatName(`${formattedLabel}Fields`),
        fields: buildFields(`${formattedLabel}Fields`, entityFields),
      }),
    },
  };

  operations.forEach((operation) => {
    const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

    fields[operation] = {
      type: new GraphQLObjectType({
        name: `${formattedLabel}${capitalizedOperation}Access`,
        fields: {
          permission: { type: new GraphQLNonNull(GraphQLBoolean) },
          where: { type: GraphQLJSONObject },
        },
      }),
    };
  });

  return fields;
};

export default function buildPoliciesType(payload: Payload): GraphQLObjectType {
  const fields = {
    canAccessAdmin: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  };

  Object.values(payload.config.collections).forEach((collection: SanitizedCollectionConfig) => {
    const collectionOperations: OperationType[] = ['create', 'read', 'update', 'delete'];

    if (collection.auth && (typeof collection.auth.maxLoginAttempts !== 'undefined' && collection.auth.maxLoginAttempts !== 0)) {
      collectionOperations.push('unlock');
    }

    if (collection.versions) {
      collectionOperations.push('readVersions');
    }

    fields[formatName(collection.slug)] = {
      type: new GraphQLObjectType({
        name: formatName(`${collection.labels.singular}Access`),
        fields: buildEntity(collection.labels.singular, collection.fields, collectionOperations),
      }),
    };
  });

  Object.values(payload.config.globals).forEach((global: SanitizedGlobalConfig) => {
    const globalOperations: OperationType[] = ['read', 'update'];

    if (global.versions) {
      globalOperations.push('readVersions');
    }

    fields[formatName(global.slug)] = {
      type: new GraphQLObjectType({
        name: formatName(`${global.label}Access`),
        fields: buildEntity(global.label, global.fields, globalOperations),
      }),
    };
  });

  return new GraphQLObjectType({
    name: 'Access',
    fields,
  });
}
