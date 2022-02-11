import {
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLList,
  Thunk,
} from 'graphql';

const withWhereAndOr = (name: string, fieldTypes: Thunk<GraphQLInputFieldConfigMap>): GraphQLInputObjectType => {
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
    },
  });
};

export default withWhereAndOr;
