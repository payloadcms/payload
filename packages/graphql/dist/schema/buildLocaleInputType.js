import { GraphQLEnumType } from 'graphql';
import { formatName } from '../utilities/formatName.js';
export const buildLocaleInputType = (localization)=>{
    return new GraphQLEnumType({
        name: 'LocaleInputType',
        values: localization.localeCodes.reduce((values, locale)=>({
                ...values,
                [formatName(locale)]: {
                    value: locale
                }
            }), {})
    });
};

//# sourceMappingURL=buildLocaleInputType.js.map