import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLEnumType,
} from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';

export const enums = {
  geojson: new GraphQLEnumType({
    name: 'GeoJSONType',
    description: 'The `GeoJSONType` enum represents a subset of the Geometry Object types as defined by [rfc7946#section-3.1](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1)',
    values: ['Polygon', 'Point'].reduce((acc, next) => {
      return {
        ...acc,
        [next]: { value: next }
      }
    }, {}),
  }),
}

export const GeoJSON = new GraphQLObjectType({
  name: 'GeoJSON',
  description: 'The `GeoJSON` type represents a GeoJSON object as defined by [rfc7946#section-3.1](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1)',
  fields: {
    type: {
      type: enums.geojson,
    },
    coordinates: {
      type: GraphQLJSON,
    },
  },
});

export const GeoJSONInput = new GraphQLInputObjectType({
  name: 'GeoJSONInput',
  description: 'The `GeoJSONInput` input type represents a GeoJSON object as defined by [rfc7946#section-3.1](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1)',
  fields: {
    type: {
      type: enums.geojson,
    },
    coordinates: {
      type: GraphQLJSON,
    },
  },
});
