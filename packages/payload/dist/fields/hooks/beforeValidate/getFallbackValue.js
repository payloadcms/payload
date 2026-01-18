import { getDefaultValue } from '../../getDefaultValue.js';
import { cloneDataFromOriginalDoc } from '../beforeChange/cloneDataFromOriginalDoc.js';
export async function getFallbackValue({ field, req, siblingDoc }) {
    let fallbackValue = undefined;
    if ('name' in field && field.name) {
        if (typeof siblingDoc[field.name] !== 'undefined') {
            fallbackValue = cloneDataFromOriginalDoc(siblingDoc[field.name]);
        } else if ('defaultValue' in field && typeof field.defaultValue !== 'undefined') {
            fallbackValue = await getDefaultValue({
                defaultValue: field.defaultValue,
                locale: req.locale || '',
                req,
                user: req.user
            });
        }
    }
    return fallbackValue;
}

//# sourceMappingURL=getFallbackValue.js.map