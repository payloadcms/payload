import { sanitizeSelectParam } from './sanitizeSelectParam.js';
/**
 * Sanitizes REST populate query to PopulateType
 */ export const sanitizePopulateParam = (unsanitizedPopulate)=>{
    if (!unsanitizedPopulate || typeof unsanitizedPopulate !== 'object') {
        return;
    }
    for(const k in unsanitizedPopulate){
        ;
        unsanitizedPopulate[k] = sanitizeSelectParam(unsanitizedPopulate[k]);
    }
    return unsanitizedPopulate;
};

//# sourceMappingURL=sanitizePopulateParam.js.map