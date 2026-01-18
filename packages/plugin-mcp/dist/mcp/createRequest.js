import { AuthenticationError } from 'payload';
export const createRequestFromPayloadRequest = (req)=>{
    if (!req.url) {
        throw new AuthenticationError();
    }
    return new Request(req.url, {
        body: req.body,
        duplex: 'half',
        headers: req.headers,
        method: req.method
    });
};

//# sourceMappingURL=createRequest.js.map