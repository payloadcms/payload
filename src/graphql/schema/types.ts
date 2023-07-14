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
  description: 'The `Polygon` type represents a GeoJSON polygon as defined by [rfc7946#section-3.1.6](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6)',
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
  description: 'The `PolygonInput` input type represents a GeoJSON polygon as defined by [rfc7946#section-3.1.6](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6)',
  fields: {
    type: {
      type: GraphQLString,
    },
    coordinates: {
      type: new GraphQLList(LinearRing),
    },
  },
});
