import { GraphQLType } from 'graphql';
import { FieldAffectingData } from '../../fields/config/types';
declare const withNullableType: (field: FieldAffectingData, type: GraphQLType, forceNullable?: boolean) => GraphQLType;
export default withNullableType;
