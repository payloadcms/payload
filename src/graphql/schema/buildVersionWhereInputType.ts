import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLString,
} from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { GraphQLJSON } from 'graphql-type-json';
import formatName from '../utilities/formatName';
import withOperators from './withOperators';
import { FieldAffectingData } from '../../fields/config/types';
import buildInputObject from './buildInputObject';
import operators from './operators';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import recursivelyBuildNestedPaths from './recursivelyBuildNestedPaths';

const buildVersionWhereInputType = (singularLabel: string, parentCollection: SanitizedCollectionConfig): GraphQLInputObjectType => {
  const name = `version${formatName(singularLabel)}`;
  const fieldTypes = {
    id: { type: GraphQLString },
    autosave: { type: GraphQLBoolean },
    // TODO: test with custom id field types, may need to support number
    updatedAt: { type: DateTimeResolver },
    createdAt: { type: DateTimeResolver },
    parent: {
      type: withOperators(
        { name: 'parent' } as FieldAffectingData,
        GraphQLJSON,
        name,
        [...operators.equality, ...operators.contains],
      ),
    },
  };

  const versionFields = recursivelyBuildNestedPaths(name, {
    name: 'version',
    type: 'group',
    fields: parentCollection.fields,
  });

  versionFields.forEach((versionField) => {
    fieldTypes[versionField.key] = versionField.type;
  });

  return buildInputObject(name, fieldTypes);
};

export default buildVersionWhereInputType;
