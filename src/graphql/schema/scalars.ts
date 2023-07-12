import { GraphQLScalarType } from 'graphql';
import { Polygon } from 'graphql-geojson-scalar-types';

export const PolygonResolver = new GraphQLScalarType(Polygon)
