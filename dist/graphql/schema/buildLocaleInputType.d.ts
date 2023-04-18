import { GraphQLEnumType, GraphQLScalarType } from 'graphql';
import { LocalizationConfig } from '../../config/types';
declare const buildLocaleInputType: (localization: LocalizationConfig) => GraphQLEnumType | GraphQLScalarType;
export default buildLocaleInputType;
