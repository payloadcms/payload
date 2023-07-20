import {
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLEnumType,
} from 'graphql';

const Position = new GraphQLList(GraphQLFloat);

const LinearRing = new GraphQLList(Position);

export const enums = {
  geojson: new GraphQLEnumType({
    name: 'GeoJSONType',
    description: 'The `GeoJSONType` enum represents a subset of the Geometry Object types as defined by [rfc7946#section-3.1](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1)',
    values: ['Polygon'].reduce((acc, next) => {
      return {
        ...acc,
        [next]: { value: next }
      }
    }, {}),
  }),
}

export const Polygon = new GraphQLObjectType({
  name: 'Polygon',
  description: 'The `Polygon` type represents a GeoJSON polygon as defined by [rfc7946#section-3.1.6](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6)',
  fields: {
    type: {
      type: enums.geojson,
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
      type: enums.geojson,
    },
    coordinates: {
      type: new GraphQLList(LinearRing),
    },
  },
});
