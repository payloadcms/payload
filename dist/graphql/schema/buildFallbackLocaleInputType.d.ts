import { GraphQLEnumType } from 'graphql';
import { LocalizationConfig } from '../../config/types';
declare const buildFallbackLocaleInputType: (localization: LocalizationConfig) => GraphQLEnumType;
export default buildFallbackLocaleInputType;
