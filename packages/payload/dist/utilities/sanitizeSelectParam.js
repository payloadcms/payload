/**
 * Sanitizes REST select query to SelectType
 */ export const sanitizeSelectParam = (unsanitizedSelect)=>{
    if (unsanitizedSelect && typeof unsanitizedSelect === 'object') {
        for(const _k in unsanitizedSelect){
            const k = _k;
            if (unsanitizedSelect[k] === 'true') {
                ;
                unsanitizedSelect[k] = true;
            } else if (unsanitizedSelect[k] === 'false') {
                ;
                unsanitizedSelect[k] = false;
            } else if (typeof unsanitizedSelect[k] === 'object') {
                sanitizeSelectParam(unsanitizedSelect[k]);
            }
        }
    }
    return unsanitizedSelect;
};

//# sourceMappingURL=sanitizeSelectParam.js.map