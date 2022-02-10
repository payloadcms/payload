import {
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  Thunk,
} from 'graphql';

const buildInputObject = (name: string, fieldTypes: Thunk<GraphQLInputFieldConfigMap>): GraphQLInputObjectType => {
  return new GraphQLInputObjectType({
    name: `${name}_where`,
    fields: {
      ...fieldTypes,
      OR: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: `${name}_where_or`,
          fields: fieldTypes,
        })),
      },
      AND: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: `${name}_where_and`,
          fields: fieldTypes,
        })),
      },
      page: { type: GraphQLInt },
      limit: { type: GraphQLInt },
      sort: { type: GraphQLString },
    },
  });
};

export default buildInputObject;
