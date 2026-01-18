import { en } from '@payloadcms/translations/languages/en';
import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
// This gets dynamically reassigned during compilation
export let ValidationErrorName = 'ValidationError';
export class ValidationError extends APIError {
    constructor(results, t){
        const message = t ? t('error:followingFieldsInvalid', {
            count: results.errors.length
        }) : results.errors.length === 1 ? en.translations.error.followingFieldsInvalid_one : en.translations.error.followingFieldsInvalid_other;
        const req = results.req;
        // delete to avoid logging the whole req
        delete results['req'];
        super(`${message} ${results.errors.map((f)=>{
            if (f.label) {
                if (typeof f.label === 'function') {
                    if (!req || !req.i18n || !req.t) {
                        return f.path;
                    }
                    return f.label({
                        i18n: req.i18n,
                        t: req.t
                    });
                }
                if (typeof f.label === 'object') {
                    if (req?.i18n?.language) {
                        return f.label[req.i18n.language];
                    }
                    return f.label[Object.keys(f.label)[0]];
                }
                return f.label;
            }
            return f.path;
        }).join(', ')}`, httpStatus.BAD_REQUEST, results);
        ValidationErrorName = this.constructor.name;
    }
}

//# sourceMappingURL=ValidationError.js.map