import { APIError } from '../errors/APIError.js';
import { processMultipartFormdata } from '../uploads/fetchAPI-multipart/index.js';
/**
 * Mutates the Request, appending 'data' and 'file' if found
 */ export const addDataAndFileToRequest = async (req)=>{
    const { body, headers, method, payload } = req;
    if (method && [
        'PATCH',
        'POST',
        'PUT'
    ].includes(method.toUpperCase()) && body) {
        const [contentType] = (headers.get('Content-Type') || '').split(';', 1);
        const bodyByteSize = parseInt(req.headers.get('Content-Length') || '0', 10);
        if (contentType === 'application/json') {
            let data = {};
            try {
                const text = await req.text?.();
                data = text ? JSON.parse(text) : {};
            } catch (error) {
                req.payload.logger.error(error);
            } finally{
                req.data = data;
                // @ts-expect-error attach json method to request
                req.json = ()=>Promise.resolve(data);
            }
        } else if (bodyByteSize && contentType?.includes('multipart/')) {
            const { error, fields, files } = await processMultipartFormdata({
                options: {
                    ...payload.config.bodyParser || {},
                    ...payload.config.upload || {}
                },
                request: req
            });
            if (error) {
                throw new APIError(error.message);
            }
            if (files?.file) {
                req.file = files.file;
            }
            if (fields?._payload && typeof fields._payload === 'string') {
                req.data = JSON.parse(fields._payload);
            }
            if (!req.file && fields?.file && typeof fields?.file === 'string') {
                const { clientUploadContext, collectionSlug, filename, mimeType, size } = JSON.parse(fields.file);
                const uploadConfig = req.payload.collections[collectionSlug].config.upload;
                if (!uploadConfig.handlers) {
                    throw new APIError('uploadConfig.handlers is not present for ' + collectionSlug);
                }
                let response = null;
                let error;
                for (const handler of uploadConfig.handlers){
                    try {
                        const result = await handler(req, {
                            doc: null,
                            params: {
                                clientUploadContext,
                                collection: collectionSlug,
                                filename
                            }
                        });
                        if (result) {
                            response = result;
                        }
                    // If we couldn't get the file from that handler, save the error and try other.
                    } catch (err) {
                        error = err;
                    }
                }
                if (!response) {
                    if (error) {
                        payload.logger.error(error);
                    }
                    throw new APIError('Expected response from the upload handler.');
                }
                req.file = {
                    name: filename,
                    clientUploadContext,
                    data: Buffer.from(await response.arrayBuffer()),
                    mimetype: response.headers.get('Content-Type') || mimeType,
                    size
                };
            }
        }
    }
};

//# sourceMappingURL=addDataAndFileToRequest.js.map