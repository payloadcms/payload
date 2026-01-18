import { GraphQLEnumType } from 'graphql';
import { formatName } from '../utilities/formatName.js';
export const buildFallbackLocaleInputType = (localization)=>{
    return new GraphQLEnumType({
        name: 'FallbackLocaleInputType',
        values: [
            ...localization.localeCodes,
            'none'
        ].reduce((values, locale)=>({
                ...values,
                [formatName(locale)]: {
                    value: locale
                }
            }), {})
    });
};

//# sourceMappingURL=buildFallbackLocaleInputType.js.map