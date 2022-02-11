import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';
import formatName from '../utilities/formatName';
import { SanitizedCollectionVersions } from '../../versions/types';

const buildVersionType = (type: GraphQLObjectType, versionsConfig: SanitizedCollectionVersions): GraphQLObjectType => {
  const autosave = (versionsConfig.drafts && versionsConfig.drafts?.autosave && { autosave: { type: GraphQLBoolean } });

  return new GraphQLObjectType({
    name: formatName(`${type.name}Version`),
    fields: {
      id: { type: GraphQLString },
      parent: { type: GraphQLString },
      version: { type },
      updatedAt: { type: new GraphQLNonNull(DateTimeResolver) },
      createdAt: { type: new GraphQLNonNull(DateTimeResolver) },
      ...autosave,
    },
  });
};

export default buildVersionType;
