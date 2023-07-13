import {
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
} from 'graphql';

const Position = new GraphQLList(GraphQLFloat);

const LinearRing = new GraphQLList(Position);

export const Polygon = new GraphQLObjectType({
  name: 'Polygon',
  fields: {
    type: {
      type: GraphQLString,
    },
    coordinates: {
      type: new GraphQLList(LinearRing),
    },
  },
});

export const PolygonInput = new GraphQLInputObjectType({
  name: 'PolygonInput',
  fields: {
    type: {
      type: GraphQLString,
    },
    coordinates: {
      type: new GraphQLList(LinearRing),
    },
  },
});
