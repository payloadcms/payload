import { isNumber } from '../isNumber.js';
import { parseBooleanString } from '../parseBooleanString.js';
import { sanitizeJoinParams } from '../sanitizeJoinParams.js';
import { sanitizePopulateParam } from '../sanitizePopulateParam.js';
import { sanitizeSelectParam } from '../sanitizeSelectParam.js';
import { sanitizeSortParams } from '../sanitizeSortParams.js';
export const booleanParams = [
    'autosave',
    'draft',
    'trash',
    'overrideLock',
    'pagination',
    'flattenLocales'
];
export const numberParams = [
    'depth',
    'limit',
    'page'
];
/**
 * Takes raw query parameters and parses them into the correct types that Payload expects.
 * Examples:
 *   a. `draft` provided as a string of "true" is converted to a boolean
 *   b. `depth` provided as a string of "0" is converted to a number
 *   c. `sort` provided as a comma-separated string or array is converted to an array of strings
 */ export const parseParams = (params)=>{
    const parsedParams = params || {};
    // iterate through known params to make this very fast
    for (const key of booleanParams){
        if (key in params) {
            parsedParams[key] = parseBooleanString(params[key]);
        }
    }
    for (const key of numberParams){
        if (key in params) {
            if (isNumber(params[key])) {
                parsedParams[key] = Number(params[key]);
            }
        }
    }
    if ('populate' in params) {
        parsedParams.populate = sanitizePopulateParam(params.populate);
    }
    if ('select' in params) {
        parsedParams.select = sanitizeSelectParam(params.select);
    }
    if ('joins' in params) {
        parsedParams.joins = sanitizeJoinParams(params.joins);
    }
    if ('sort' in params) {
        parsedParams.sort = sanitizeSortParams(params.sort);
    }
    if ('data' in params && typeof params.data === 'string' && params.data.length > 0) {
        parsedParams.data = JSON.parse(params.data);
    }
    return parsedParams;
};

//# sourceMappingURL=index.js.map