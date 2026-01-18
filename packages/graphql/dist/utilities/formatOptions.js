import { formatName } from './formatName.js';
export const formatOptions = (field)=>{
    return field.options.reduce((values, option)=>{
        if (typeof option === 'object') {
            return {
                ...values,
                [formatName(option.value)]: {
                    value: option.value
                }
            };
        }
        return {
            ...values,
            [formatName(option)]: {
                value: option
            }
        };
    }, {});
};

//# sourceMappingURL=formatOptions.js.map