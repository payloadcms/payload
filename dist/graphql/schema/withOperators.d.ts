import { GraphQLInputObjectType, GraphQLType } from 'graphql';
import { FieldAffectingData } from '../../fields/config/types';
declare const withOperators: (field: FieldAffectingData, type: GraphQLType, parentName: string, operators: string[]) => GraphQLInputObjectType;
export default withOperators;
