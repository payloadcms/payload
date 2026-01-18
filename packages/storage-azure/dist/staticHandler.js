import { RestError } from '@azure/storage-blob';
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities';
import path from 'path';
import { getRangeRequestInfo } from 'payload/internal';
export const getHandler = ({ collection, getStorageClient })=>{
    return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } })=>{
        try {
            const prefix = await getFilePrefix({
                clientUploadContext,
                collection,
                filename,
                req
            });
            const blockBlobClient = getStorageClient().getBlockBlobClient(path.posix.join(prefix, filename));
            // Get file size for range validation
            const properties = await blockBlobClient.getProperties();
            const fileSize = properties.contentLength;
            if (!fileSize) {
                return new Response('Internal Server Error', {
                    status: 500
                });
            }
            // Handle range request
            const rangeHeader = req.headers.get('range');
            const rangeResult = getRangeRequestInfo({
                fileSize,
                rangeHeader
            });
            if (rangeResult.type === 'invalid') {
                return new Response(null, {
                    headers: new Headers(rangeResult.headers),
                    status: rangeResult.status
                });
            }
            // Download with range if partial
            const blob = rangeResult.type === 'partial' ? await blockBlobClient.download(rangeResult.rangeStart, rangeResult.rangeEnd - rangeResult.rangeStart + 1) : await blockBlobClient.download();
            let headers = new Headers(incomingHeaders);
            // Add range-related headers from the result
            for (const [key, value] of Object.entries(rangeResult.headers)){
                headers.append(key, value);
            }
            // Add Azure-specific headers
            headers.append('Content-Type', String(properties.contentType));
            if (properties.etag) {
                headers.append('ETag', String(properties.etag));
            }
            const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match');
            if (collection.upload && typeof collection.upload === 'object' && typeof collection.upload.modifyResponseHeaders === 'function') {
                headers = collection.upload.modifyResponseHeaders({
                    headers
                }) || headers;
            }
            if (etagFromHeaders && etagFromHeaders === properties.etag) {
                return new Response(null, {
                    headers,
                    status: 304
                });
            }
            // Manually create a ReadableStream for the web from a Node.js stream.
            const readableStream = new ReadableStream({
                start (controller) {
                    const nodeStream = blob.readableStreamBody;
                    if (!nodeStream) {
                        throw new Error('No readable stream body');
                    }
                    nodeStream.on('data', (chunk)=>{
                        controller.enqueue(new Uint8Array(chunk));
                    });
                    nodeStream.on('end', ()=>{
                        controller.close();
                    });
                    nodeStream.on('error', (err)=>{
                        controller.error(err);
                    });
                }
            });
            return new Response(readableStream, {
                headers,
                status: rangeResult.status
            });
        } catch (err) {
            if (err instanceof RestError && err.statusCode === 404) {
                return new Response(null, {
                    status: 404,
                    statusText: 'Not Found'
                });
            }
            req.payload.logger.error(err);
            return new Response('Internal Server Error', {
                status: 500
            });
        }
    };
};

//# sourceMappingURL=staticHandler.js.map