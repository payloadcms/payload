import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';
import formatName from '../utilities/formatName';

const buildVersionType = (type: GraphQLObjectType): GraphQLObjectType => {
  return new GraphQLObjectType({
    name: formatName(`${type.name}Version`),
    fields: {
      id: { type: GraphQLString },
      parent: { type: GraphQLString },
      autosave: { type: GraphQLBoolean },
      version: { type },
      updatedAt: { type: new GraphQLNonNull(DateTimeResolver) },
      createdAt: { type: new GraphQLNonNull(DateTimeResolver) },
    },
  });
};

export default buildVersionType;
