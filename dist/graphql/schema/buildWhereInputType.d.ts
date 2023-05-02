import { GraphQLInputObjectType } from 'graphql';
import { Field } from '../../fields/config/types';
declare const buildWhereInputType: (name: string, fields: Field[], parentName: string) => GraphQLInputObjectType;
export default buildWhereInputType;
