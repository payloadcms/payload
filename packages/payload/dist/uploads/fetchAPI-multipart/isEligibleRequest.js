// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-obscure-range
const ACCEPTABLE_CONTENT_TYPE = /multipart\/['"()+-_]+(?:; ?['"()+-_]*)+$/i;
const UNACCEPTABLE_METHODS = new Set([
    'CONNECT',
    'DELETE',
    'GET',
    'HEAD',
    'OPTIONS',
    'TRACE'
]);
const hasBody = (req)=>{
    return Boolean(req.headers.get('transfer-encoding') || req.headers.get('content-length') && req.headers.get('content-length') !== '0');
};
const hasAcceptableMethod = (req)=>!UNACCEPTABLE_METHODS.has(req.method);
const hasAcceptableContentType = (req)=>{
    const contType = req.headers.get('content-type');
    return contType.includes('boundary=') && ACCEPTABLE_CONTENT_TYPE.test(contType);
};
export const isEligibleRequest = (req)=>{
    try {
        return hasBody(req) && hasAcceptableMethod(req) && hasAcceptableContentType(req);
    } catch (ignore) {
        return false;
    }
};

//# sourceMappingURL=isEligibleRequest.js.map