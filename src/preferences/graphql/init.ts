import { GraphQLJSON } from 'graphql-type-json';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';

function registerPreferences(): void {
  const {
    findOne, update, delete: deleteOperation,
  } = this.operations.preferences;


  const valueType = GraphQLJSON;

  const preferenceType = new GraphQLObjectType({
    name: 'Preference',
    fields: {
      key: {
        type: GraphQLNonNull(GraphQLString),
      },
      value: { type: valueType },
      createdAt: { type: new GraphQLNonNull(DateTimeResolver) },
      updatedAt: { type: new GraphQLNonNull(DateTimeResolver) },
    },
  });

  this.Query.fields.Preference = {
    type: preferenceType,
    args: {
      key: { type: GraphQLString },
    },
    resolve: (_, { key }, context) => {
      const { user } = context.req;
      return findOne({ key, user, req: context.req });
    },
  };

  this.Mutation.fields.updatePreference = {
    type: preferenceType,
    args: {
      key: { type: new GraphQLNonNull(GraphQLString) },
      value: { type: valueType },
    },
    resolve: (_, { key, value }, context) => {
      const { user } = context.req;
      return update({ key, user, req: context.req, value });
    },
  };

  this.Mutation.fields.deletePreference = {
    type: preferenceType,
    args: {
      key: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: (_, { key }, context) => {
      const { user } = context.req;
      return deleteOperation({ key, user, req: context.req });
    },
  };
}

export default registerPreferences;
