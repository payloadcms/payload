import { GraphQLEnumType, GraphQLScalarType } from 'graphql';
import { LocalizationConfig } from '../../config/types';
import formatName from '../utilities/formatName';

const buildLocaleInputType = (localization: LocalizationConfig): GraphQLEnumType | GraphQLScalarType => {
  return new GraphQLEnumType({
    name: 'LocaleInputType',
    values: localization.locales.reduce((values, locale) => ({
      ...values,
      [formatName(locale)]: {
        value: locale,
      },
    }), {}),
  });
};

export default buildLocaleInputType;
